import React from 'react';

/**
 * A reusable form field component with consistent styling
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name/id
 * @param {string} props.type - Input type (text, email, number, etc.)
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler function
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.helpText - Help text to display below the field
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 * @param {string} props.className - Additional class names
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  helpText = '',
  required = false,
  error = '',
  className = '',
  ...props
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`
            mt-1 block w-full rounded-md shadow-sm 
            focus:ring-blue-500 focus:border-blue-500 
            dark:bg-gray-800 dark:text-white dark:border-gray-600
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
          rows={4}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          required={required}
          className={`
            mt-1 block w-full rounded-md shadow-sm 
            focus:ring-blue-500 focus:border-blue-500 
            dark:bg-gray-800 dark:text-white dark:border-gray-600
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`
            mt-1 block w-full rounded-md shadow-sm 
            focus:ring-blue-500 focus:border-blue-500 
            dark:bg-gray-800 dark:text-white dark:border-gray-600
            ${error ? 'border-red-300' : 'border-gray-300'}
          `}
          {...props}
        />
      )}
      
      {helpText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
} 