'use client';

import React from 'react';
import { Volume2, Monitor, RotateCcw, Type, Droplet } from 'lucide-react';
import {
  HighlightMode,
  UserSettings,
  useSettings,
} from '@/app/hooks/useSettings';
import { ColorPickerPopover } from './ColorPickerPopover';

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
    <div className="space-y-16 p-4">
      <div className="space-y-4">
        <h3 className="text-xl font-medium flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          Display Settings
        </h3>
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">Font Size</label>
            <input
              type="range"
              min="12"
              max="32"
              step="2"
              value={settings.fontSize}
              onChange={(e) =>
                updateSetting('fontSize', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-medium flex items-center gap-2">
          <Type className="h-6 w-6" />
          Text Appearance
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium text-gray-600">
            Highlight Mode
          </label>
          <select
            className="w-full rounded-md border border-gray-200 p-2"
            value={settings.highlightMode}
            onChange={(e) =>
              updateSetting('highlightMode', e.target.value as HighlightMode)
            }
          >
            <option value="current">Current word</option>
            <option value="all past">All previous words</option>
            <option value="past row">Previous words in the same row</option>
          </select>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-base font-medium text-gray-600">
              Highlight Color
            </h4>
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Text</p>
                <ColorPickerPopover
                  color={settings.pastWordsColor}
                  onChange={handleColorChange('pastWordsColor')}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Background</p>
                <div className="flex items-center gap-2">
                  <div className="relative bg-white rounded-md w-12 h-8 border border-gray-200">
                    <div
                      className="absolute inset-0 cursor-pointer"
                      style={{
                        background: `linear-gradient(to right top, transparent calc(50% - 2px), red calc(50% - 2px), red calc(50% + 2px), transparent calc(50% + 2px))`,
                      }}
                      title="Transparent"
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
            <h4 className="text-base font-medium text-gray-600">Main Text</h4>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">Text</p>
              <ColorPickerPopover
                color={settings.currentWordColor}
                onChange={handleColorChange('currentWordColor')}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={resetSettings}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </button>
    </div>
  );
};

export default Settings;
