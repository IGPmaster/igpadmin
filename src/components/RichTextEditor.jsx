import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import PropTypes from 'prop-types';
import 'react-quill/dist/quill.snow.css';
import '../lib/quill-dark.css';

/**
 * A reusable rich text editor component that wraps ReactQuill
 * 
 * @param {Object} props
 * @param {string} props.value - Editor content
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.label - Field label
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.darkMode - Whether to use dark mode styling
 * @param {number} props.minHeight - Minimum height of the editor
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 */
export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Enter content here...',
  darkMode = false,
  minHeight = 200,
  required = false,
  error = '',
}) {
  const [editorValue, setEditorValue] = useState(value || '');
  const quillRef = useRef(null);
  
  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);

  const handleChange = (content) => {
    setEditorValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background'
  ];

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div 
        className={`
          ${darkMode ? 'quill-dark' : ''}
          ${error ? 'border border-red-300 rounded-md' : ''}
        `}
        style={{ minHeight: `${minHeight}px` }}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ 
            height: `${minHeight - 42}px`,
            borderRadius: error ? '0.375rem' : undefined
          }}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  darkMode: PropTypes.bool,
  minHeight: PropTypes.number,
  required: PropTypes.bool,
  error: PropTypes.string
}; 