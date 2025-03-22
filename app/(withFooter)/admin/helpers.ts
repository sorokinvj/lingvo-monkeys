// Вспомогательные функции и интерфейсы для админ-панели

// Проверка является ли пользователь администратором
export function isAdminEmail(email: string | null | undefined): boolean {
  return email === 'sorokinvj@gmail.com' || email === 'bichiko@gmail.com';
}
