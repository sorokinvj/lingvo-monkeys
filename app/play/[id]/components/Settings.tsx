'use client';

import React from 'react';
import { RotateCcw, Sun, Type } from 'lucide-react';
import { HighlightMode, useSettings } from '@/hooks/useSettings';
import { ColorPickerPopover } from './ColorPickerPopover';
import { FontSelector } from './FontSelector';
import { FontOption } from '@/config/fonts';
import { ThemeSwitcher } from '@/components/theme-switcher';

const Settings: React.FC = () => {
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
    <div className="space-y-16 p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
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
            Режим выделения
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
              Цвет выделения
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
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-xl font-medium flex items-center gap-2">
            <Type className="h-6 w-6" />
            Задержка выделения
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Иногда выделение сходит с ума и начинает обгонять голос (примерно
            как перила обгоняют ступеньки эскалатора в метро). В таких случаях
            бывает полезно замедлить выделение.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Задержка выделения по отношению к голосу (секунды)
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
      <button
        onClick={resetSettings}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Сбросить настройки
      </button>
    </div>
  );
};

export default Settings;
