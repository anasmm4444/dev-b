import React, { useState } from 'react';
import { Delete } from 'lucide-react';

interface StaticEmojiPickerProps {
  onEmojiSelected: (emoji: string) => void;
  onBackspace: () => void;
}

const EMOJI_CATEGORIES = [
  {
    title: 'وجوه',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
      '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
      '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯',
      '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
      '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
      '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    ],
  },
  {
    title: 'إيماءات',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
      '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '👀',
    ],
  },
  {
    title: 'رموز وقلوب',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '💯', '🔥', '💥', '✨', '🌟', '⭐', '💫', '⚡',
      '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🛡️', '⚔️',
    ],
  },
  {
    title: 'أشياء وحياة',
    emojis: [
      '☕', '🍵', '🧋', '🥤', '🍺', '🍻', '🥂', '🍷',
      '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🎂',
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎮', '🕹️',
      '📱', '📲', '💻', '⌨️', '🖥️', '📷', '📸', '📹',
      '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺',
      '🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚀',
    ],
  },
];

export const StaticEmojiPicker: React.FC<StaticEmojiPickerProps> = ({
  onEmojiSelected,
  onBackspace,
}) => {
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);

  const currentEmojis = EMOJI_CATEGORIES[selectedCategoryIdx]?.emojis || [];

  return (
    <div
      className="w-full h-64 bg-[#0B0E14] border-t border-[#2D333B] flex flex-col select-none"
      dir="rtl"
    >
      {/* Category Tabs Header */}
      <div className="flex items-center justify-between bg-[#161B22] px-3 py-1.5 border-b border-[#2D333B]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.title}
              onClick={() => setSelectedCategoryIdx(idx)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                selectedCategoryIdx === idx
                  ? 'bg-[#2D333B] text-white font-bold'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        <button
          onClick={onBackspace}
          className="p-1.5 text-[#8B949E] hover:text-white bg-[#0B0E14] border border-[#2D333B] rounded-lg transition-colors shrink-0 mr-2"
          title="مسح"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 p-3 overflow-y-auto grid grid-cols-8 sm:grid-cols-10 gap-2">
        {currentEmojis.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            onClick={() => onEmojiSelected(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-[#161B22] rounded-lg transition-transform active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
