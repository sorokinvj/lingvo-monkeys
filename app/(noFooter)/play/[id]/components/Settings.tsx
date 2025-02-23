'use client';

import React, { FC } from 'react';
import { RotateCcw, Sun, Type } from 'lucide-react';
import { HighlightMode, TextAlignment, useSettings } from '@/hooks/useSettings';
import { ColorPickerPopover } from './ColorPickerPopover';
import { FontSelector } from './FontSelector';
import { FontOption } from '@/config/fonts';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Toggle from '@/components/ui/toggle';

const Settings: FC = () => {
  const { settings, updateSetting, resetSettings } = useSettings();

  const handleColorChange = (
    key:
      | 'pastWordsColor'
      | 'currentWordColor'
      | 'pastWordsHighlightColor'
      | 'currentWordHighlightColor'
  ) => {
    return (color: string) => {
      requestAnimationFrame(() => {
        updateSetting(key, color);
      });
    };
  };

  return (
    <div className="flex flex-col gap-12 p-4">
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-xl font-medium flex items-center gap-2">
            <Sun className="h-6 w-6" />
            Тема
          </h3>
          <div className="flex items-center">
            <ThemeSwitcher
              onSelect={(theme) => updateSetting('theme', theme)}
            />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-xl font-medium flex items-center gap-2">
            <Type className="h-6 w-6" />
            Настройки шрифта
          </h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Размер
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.125"
                value={settings.fontSize}
                onChange={(e) =>
                  updateSetting('fontSize', parseFloat(e.target.value))
                }
                className="w-full"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(settings.fontSize * 16)}px
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Межстрочный интервал
              </label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) =>
                  updateSetting('lineHeight', parseFloat(e.target.value))
                }
                className="w-full"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {(settings.lineHeight * 100).toFixed(0)}%
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Шрифт
              </label>
              <FontSelector
                value={settings.fontFamily}
                onChange={(font) =>
                  updateSetting('fontFamily', font as FontOption)
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-medium flex items-center gap-2">
          <Type className="h-6 w-6" />
          Внешний вид текста
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-gray-600 dark:text-gray-400">
            Режим маркера
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            По отношению к текущей позиции плеера, выделять:
          </p>
          <select
            className="w-full rounded-md border border-gray-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 dark:text-gray-200"
            value={settings.highlightMode}
            onChange={(e) =>
              updateSetting('highlightMode', e.target.value as HighlightMode)
            }
          >
            <option value="current">Текущее слово</option>
            <option value="past row">Текущую строку</option>
            <option value="all past">Все предыдущие слова</option>
          </select>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-base font-medium text-gray-600">
              Цвет маркера
            </h4>
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Текст</p>
                <ColorPickerPopover
                  color={settings.pastWordsColor}
                  onChange={handleColorChange('pastWordsColor')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Фон</p>
                <div className="flex items-center gap-2">
                  <div className="relative bg-white rounded-md w-12 h-8 border border-gray-200">
                    <div
                      className="absolute inset-0 cursor-pointer"
                      style={{
                        background: `linear-gradient(to right top, transparent calc(50% - 2px), red calc(50% - 2px), red calc(50% + 2px), transparent calc(50% + 2px))`,
                      }}
                      title="Прозрачный"
                      onClick={() =>
                        handleColorChange('pastWordsHighlightColor')(
                          'transparent'
                        )
                      }
                    />
                  </div>
                  <ColorPickerPopover
                    color={settings.pastWordsHighlightColor}
                    onChange={handleColorChange('pastWordsHighlightColor')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-base font-medium text-gray-600">
              Основной текст
            </h4>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Текст</p>
              <ColorPickerPopover
                color={settings.currentWordColor}
                onChange={handleColorChange('currentWordColor')}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-gray-600 dark:text-gray-400">
            Выравнивание текста
          </label>
          <select
            className="w-full rounded-md border border-gray-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 dark:text-gray-200"
            value={settings.textAlignment}
            onChange={(e) =>
              updateSetting('textAlignment', e.target.value as TextAlignment)
            }
          >
            <option value="left">По левому краю</option>
            <option value="center">По центру</option>
            <option value="right">По правому краю</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-xl font-medium flex items-center gap-2">
            <Type className="h-6 w-6" />
            Задержка маркера
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Иногда маркер сходит с ума и начинает обгонять голос (примерно как
            перила обгоняют ступеньки эскалатора в метро). В таких случаях
            бывает полезно приструнить маркер.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Задержка маркера по отношению к голосу (секунды)
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={settings.highlightDelay}
              onChange={(e) =>
                updateSetting('highlightDelay', parseFloat(e.target.value))
              }
              className="w-full"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {settings.highlightDelay.toFixed(1)}s
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-xl font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Type className="h-6 w-6" />
              Воздух в тексте
            </div>
            <Toggle
              id="enableTextBreathing"
              checked={settings.enableTextBreathing}
              onChange={(checked) => {
                updateSetting('enableTextBreathing', checked);
              }}
            />
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Мы разбиваем текст на абзацы каждый раз, когда диктор делает паузу.
            Так в тексте появляется воздух и читать становится удобней.
            Воздушность текста можно настроить.
          </p>
          <div
            className={`space-y-4 ${!settings.enableTextBreathing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Когда добавлять воздух (если диктор молчит дольше X секунд)
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={settings.pauseThreshold}
                onChange={(e) =>
                  updateSetting('pauseThreshold', parseFloat(e.target.value))
                }
                disabled={!settings.enableTextBreathing}
                className="w-full"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {settings.pauseThreshold.toFixed(1)} сек
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Сколько воздуха добавлять (количество пустых строк)
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={settings.pauseLines}
                onChange={(e) =>
                  updateSetting('pauseLines', parseInt(e.target.value))
                }
                disabled={!settings.enableTextBreathing}
                className="w-full"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {settings.pauseLines}{' '}
                {settings.pauseLines === 1
                  ? 'строка'
                  : settings.pauseLines < 5
                    ? 'строки'
                    : 'строк'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t">
        <button
          onClick={resetSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="rotate-90"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          Сбросить настройки
        </button>
      </div>
    </div>
  );
};

export default Settings;
