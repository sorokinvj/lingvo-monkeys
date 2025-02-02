// migrations/storage-migration.ts
import dotenv from 'dotenv';
const parsed = dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { File, Status } from '@/schema/models';
import fs from 'fs';
import { formatFileName } from '@/utils/utils';

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error('Supabase credentials not found');
}

// Проверка длины ключа
if (process.env.SUPABASE_SERVICE_ROLE_KEY.length < 100) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY appears to be truncated. Please check the key in .env.local'
  );
}

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_REGION ||
  !process.env.AWS_BUCKET_NAME
) {
  throw new Error('AWS credentials not found');
}

// Убираем логи конфиденциальных данных
console.log('Loaded environment variables');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Bucket:', process.env.AWS_BUCKET_NAME);

console.log('Checking Supabase credentials:');
console.log('URL length:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length);
console.log(
  'Service role key length:',
  process.env.SUPABASE_SERVICE_ROLE_KEY?.length
);

// Проверяем значения прямо перед использованием
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function migrateFiles(isDryRun = true) {
  try {
    console.log(`Running in ${isDryRun ? 'DRY RUN' : 'PRODUCTION'} mode`);

    // Проверяем подключение к Supabase
    const { data: testConnection, error: connectionError } = await supabase
      .from('File')
      .select('*', { count: 'exact', head: true });
    if (connectionError)
      throw new Error(`Cannot connect to Supabase: ${connectionError.message}`);

    // Проверяем подключение к S3
    try {
      await s3Client.config.credentials();
    } catch (e) {
      throw new Error(`Cannot connect to AWS: ${e}`);
    }

    // Получаем все файлы и делаем предварительный анализ
    const { data: files, error } = await supabase
      .from('File')
      .select('*')
      .returns<File[]>();

    if (error) throw error;

    console.log('\n=== Pre-migration analysis ===');
    console.log(`Total files to migrate: ${files.length}`);
    console.log(
      `Total size: ${files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024}MB`
    );
    console.log(
      'Files by status:',
      files.reduce(
        (acc, f) => {
          acc[f.status] = (acc[f.status] || 0) + 1;
          return acc;
        },
        {} as Record<Status, number>
      )
    );

    // Проверяем потенциальные проблемы
    const potentialIssues = files.filter(
      (f) =>
        !f.path || // нет пути
        !f.name || // нет имени
        f.name.includes('..') || // потенциально опасные символы в имени
        !f.mimeType // нет типа файла
    );

    if (potentialIssues.length > 0) {
      console.log('\n⚠️ Found potentially problematic files:');
      potentialIssues.forEach((f) =>
        console.log(
          `- ${f.name} (${f.id}): ${!f.path ? 'no path' : !f.name ? 'no name' : !f.mimeType ? 'no mime type' : 'suspicious name'}`
        )
      );
    }

    if (!isDryRun) {
      // Спрашиваем подтверждение только в production режиме
      console.log('\n⚠️ PRODUCTION MODE - This will actually move files!');
      console.log(
        'Do you want to proceed with migration? Type "yes" to continue'
      );
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        readline.question('> ', resolve);
      });
      readline.close();

      if (answer !== 'yes') {
        console.log('Migration aborted');
        return;
      }
    }

    // Создаем лог-файл
    const logStream = fs.createWriteStream('migration.log', { flags: 'a' });
    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      const logMessage = `${timestamp}: ${msg}`;
      logStream.write(logMessage + '\n');
      console.log(logMessage);
    };

    log(`Starting ${isDryRun ? 'DRY RUN' : 'PRODUCTION'} migration`);

    // Проходим по файлам
    for (const file of files) {
      try {
        log(`Processing file: ${file.name} (${file.id})`);

        if (isDryRun) {
          // В dry run режиме только проверяем
          log(
            `[DRY RUN] Would migrate file: ${file.path} -> ${file.userId}/${file.name}`
          );
          log(
            `[DRY RUN] Would update URL to: https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.userId}/${file.name}`
          );
          continue;
        }

        // Проверяем существование файла в Supabase
        const { data: fileExists } = await supabase.storage
          .from('your-bucket-name')
          .download(file.path);

        if (!fileExists) {
          log(`⚠️ File ${file.name} not found in Supabase storage, skipping`);
          continue;
        }

        // Проверяем, не существует ли уже файл в S3
        const key = `${file.userId}/${file.name}`;
        const newUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        try {
          await s3Client.send(
            new HeadObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: key,
            })
          );
          log(`⚠️ File ${file.name} already exists in S3, skipping`);
          continue;
        } catch (err) {
          // Файла нет в S3, можно загружать
        }

        // Создаем бэкап текущих данных
        const backup = {
          path: file.path,
          publicUrl: file.publicUrl,
          status: file.status,
        };

        // Загружаем файл в S3
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('your-bucket-name')
          .download(file.path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download: ${downloadError?.message}`);
        }

        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
            Body: fileData,
            ContentType: file.mimeType,
          },
        });

        await upload.done();

        // Проверяем успешность загрузки
        try {
          await s3Client.send(
            new HeadObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME!,
              Key: key,
            })
          );
        } catch (err) {
          throw new Error('File upload verification failed');
        }

        // Обновляем запись в базе
        const { error: updateError } = await supabase
          .from('File')
          .update({
            publicUrl: newUrl,
            path: key,
            status: file.status || ('transcribed' as Status),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', file.id);

        if (updateError) {
          // Если обновление не удалось, пытаемся удалить файл из S3
          try {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: key,
              })
            );
          } catch (cleanupError) {
            log(`⚠️ Failed to cleanup S3 after update error: ${cleanupError}`);
          }
          throw updateError;
        }

        log(`✅ Successfully migrated ${file.name}`);
      } catch (fileError) {
        log(`❌ Error processing file ${file.name}: ${fileError}`);
      }
    }

    log(`Migration ${isDryRun ? 'simulation' : 'process'} completed!`);
    logStream.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function generateMigrationReport() {
  const { data: files, error } = await supabase
    .from('File')
    .select('*')
    .returns<File[]>();

  if (error) throw error;

  const report = files.map((file) => {
    const originalName = file.name;
    const formattedName = formatFileName(file.name);
    const willChange = originalName !== formattedName;

    return {
      id: file.id,
      userId: file.userId,
      originalName,
      formattedName,
      willChange,
      oldPath: file.path,
      newPath: `${file.userId}/${formattedName}`,
      changes: willChange
        ? [
            originalName.includes(' ') ? 'Spaces removed' : null,
            originalName !== originalName.toLowerCase()
              ? 'Case normalized'
              : null,
            originalName.match(/[^a-zA-Z0-9-_.]/)
              ? 'Special characters removed'
              : null,
          ].filter(Boolean)
        : [],
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  });

  // Добавляем статистику
  const stats = {
    totalFiles: files.length,
    filesToRename: report.filter((r) => r.willChange).length,
    commonIssues: {
      spacesInName: report.filter((r) => r.originalName.includes(' ')).length,
      specialChars: report.filter((r) =>
        r.originalName.match(/[^a-zA-Z0-9-_.]/)
      ).length,
      caseIssues: report.filter(
        (r) => r.originalName !== r.originalName.toLowerCase()
      ).length,
    },
  };

  fs.writeFileSync(
    'migration-report.json',
    JSON.stringify({ stats, files: report }, null, 2)
  );

  console.log('Migration report saved to migration-report.json');
  console.log('\nSummary:');
  console.log(`Total files: ${stats.totalFiles}`);
  console.log(`Files to rename: ${stats.filesToRename}`);
  console.log('Common issues:', stats.commonIssues);
}

// Запускаем в dry run режиме
migrateFiles(true);

// Запускаем генерацию отчета
generateMigrationReport();
