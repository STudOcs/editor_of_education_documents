import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

const TipTapEditor: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: `
      <h1>Отчет по учебной практике</h1>
      <h2>Введение</h2>
      <p>Начните вводить текст вашего документа здесь...</p>
    `,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container p-6 max-w-4xl mx-auto">
      <div className="toolbar border border-gray-300 rounded-t-md p-2 bg-gray-50 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          <u>U</u>
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-2 rounded ${editor.isActive('paragraph') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          P
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          H2
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
        >
          1. List
        </button>
      </div>

      <EditorContent 
        editor={editor} 
        className="editor-content border border-gray-300 border-t-0 rounded-b-md min-h-[500px] p-6 prose max-w-none"
      />
    </div>
  );
};

export default TipTapEditor;