/**
 * Web-Heavy Test Component
 * 
 * This component is designed to test the analyzer's detection of web-specific patterns.
 * Expected Pattern Counts:
 * - className patterns: 25+ occurrences
 * - onClick patterns: 5 occurrences  
 * - document API patterns: 3 occurrences
 * - window API patterns: 2 occurrences
 * - localStorage patterns: 2 occurrences
 * - Web HTML elements: 15+ occurrences (<div>, <span>, <button>, <input>, etc.)
 * 
 * Total Expected Web Patterns: 50+ patterns
 * Expected Reusability: <50% (heavy web-specific code)
 */

import React, { useState, useEffect } from 'react';

interface WebHeavyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function WebHeavyModal({ isOpen, onClose, title }: WebHeavyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Web-specific useEffect with document and window APIs
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // document API pattern
      window.addEventListener('keydown', handleEscapeKey); // window API pattern
      
      // LocalStorage usage
      const savedData = localStorage.getItem('webModalFormData'); // localStorage pattern
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset'; // document API pattern
      window.removeEventListener('keydown', handleEscapeKey); // window API pattern
    };
  }, [isOpen]);

  // Web-specific event handlers
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Save to localStorage
    localStorage.setItem('webModalFormData', JSON.stringify(newFormData)); // localStorage pattern
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    // Simulate web form submission
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 2000);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Extensive web-specific JSX with many className patterns
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"> {/* className pattern 1 */}
      <div 
        className="fixed inset-0 cursor-pointer" {/* className pattern 2 */}
        onClick={handleBackdropClick} {/* onClick pattern 1 */}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto"> {/* className pattern 3 */}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200"> {/* className pattern 4 */}
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2> {/* className pattern 5 */}
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1" {/* className pattern 6 */}
            onClick={onClose} {/* onClick pattern 2 */}
          >
            <span className="sr-only">Close modal</span> {/* className pattern 7 */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor"> {/* className pattern 8 */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4"> {/* className pattern 9 */}
          <div className="space-y-2"> {/* className pattern 10 */}
            <label htmlFor="name" className="block text-sm font-medium text-gray-700"> {/* className pattern 11 */}
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" {/* className pattern 12 */}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2"> {/* className pattern 13 */}
            <label htmlFor="email" className="block text-sm font-medium text-gray-700"> {/* className pattern 14 */}
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" {/* className pattern 15 */}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="space-y-2"> {/* className pattern 16 */}
            <label htmlFor="message" className="block text-sm font-medium text-gray-700"> {/* className pattern 17 */}
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" {/* className pattern 18 */}
              placeholder="Enter your message"
              required
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200"> {/* className pattern 19 */}
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" {/* className pattern 20 */}
              onClick={onClose} {/* onClick pattern 3 */}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" {/* className pattern 21 */}
              onClick={() => console.log('Submitting form')} {/* onClick pattern 4 */}
            >
              {isSubmitting ? (
                <span className="flex items-center"> {/* className pattern 22 */}
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"> {/* className pattern 23 */}
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /> {/* className pattern 24 */}
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /> {/* className pattern 25 */}
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>

        {/* Web-specific debugging info */}
        <div className="px-6 pb-4 text-xs text-gray-500"> {/* className pattern 26 */}
          <span className="block">User Agent: {window.navigator?.userAgent || 'Unknown'}</span> {/* className pattern 27 */}
          <button 
            type="button"
            className="mt-1 text-blue-600 hover:text-blue-800 underline" {/* className pattern 28 */}
            onClick={() => window.open('https://example.com', '_blank')} {/* onClick pattern 5 */}
          >
            Open External Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default WebHeavyModal;