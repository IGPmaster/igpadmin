import FormSection from './FormSection';
import FormField from './FormField';
import { Globe } from 'lucide-react';

/**
 * A reusable component for managing SEO metadata
 * 
 * @param {Object} props
 * @param {Object} props.metadata - Metadata object
 * @param {Function} props.onChange - Change handler function
 * @param {boolean} props.defaultExpanded - Whether the section is expanded by default
 */
export default function MetaDataSection({ 
  metadata = {}, 
  onChange,
  defaultExpanded = true 
}) {
  const handleChange = (field, value) => {
    if (onChange) {
      onChange({
        ...metadata,
        [field]: value
      });
    }
  };

  const handleKeywordsChange = (value) => {
    // Convert comma-separated string to array
    const keywordsArray = value
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword !== '');
    
    handleChange('keywords', keywordsArray);
  };

  return (
    <FormSection 
      title="SEO & Metadata" 
      icon={<Globe size={18} />}
      defaultExpanded={defaultExpanded}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Meta Title"
          name="meta-title"
          value={metadata.title || ''}
          onChange={(value) => handleChange('title', value)}
          placeholder="Enter meta title"
          helpText="Recommended length: 50-60 characters"
        />
        
        <FormField
          label="Meta Description"
          name="meta-description"
          type="textarea"
          value={metadata.description || ''}
          onChange={(value) => handleChange('description', value)}
          placeholder="Enter meta description"
          helpText="Recommended length: 150-160 characters"
        />
        
        <FormField
          label="Keywords"
          name="meta-keywords"
          value={(metadata.keywords || []).join(', ')}
          onChange={handleKeywordsChange}
          placeholder="Enter keywords separated by commas"
          helpText="Example: casino, slots, games"
        />
        
        <FormField
          label="Focus Keyword"
          name="focus-keyword"
          value={metadata.focus_keyword || ''}
          onChange={(value) => handleChange('focus_keyword', value)}
          placeholder="Enter primary keyword"
          helpText="The main keyword you want to rank for"
        />
        
        <FormField
          label="Canonical URL"
          name="canonical-url"
          value={metadata.canonical_url || ''}
          onChange={(value) => handleChange('canonical_url', value)}
          placeholder="https://example.com/page"
          helpText="Leave empty to use the default URL"
        />
      </div>
      
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3">
        Open Graph Settings
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="OG Title"
          name="og-title"
          value={metadata.og_title || ''}
          onChange={(value) => handleChange('og_title', value)}
          placeholder="Enter Open Graph title"
          helpText="Leave empty to use Meta Title"
        />
        
        <FormField
          label="OG Description"
          name="og-description"
          type="textarea"
          value={metadata.og_description || ''}
          onChange={(value) => handleChange('og_description', value)}
          placeholder="Enter Open Graph description"
          helpText="Leave empty to use Meta Description"
        />
        
        <FormField
          label="OG Image URL"
          name="og-image"
          value={metadata.og_image || ''}
          onChange={(value) => handleChange('og_image', value)}
          placeholder="https://example.com/image.jpg"
          helpText="Image to display when shared on social media"
        />
      </div>
      
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3">
        Indexing Settings
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="index"
            checked={metadata.index !== false}
            onChange={(e) => handleChange('index', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="index" className="text-sm text-gray-700 dark:text-gray-300">
            Allow search engines to index this page
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="follow"
            checked={metadata.follow !== false}
            onChange={(e) => handleChange('follow', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="follow" className="text-sm text-gray-700 dark:text-gray-300">
            Allow search engines to follow links
          </label>
        </div>
      </div>
    </FormSection>
  );
} 