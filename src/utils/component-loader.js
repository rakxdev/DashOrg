/**
 * Component Loader Utility
 * Loads external HTML components into the page
 */

export class ComponentLoader {
  /**
   * Load an HTML component from a file
   * @param {string} path - Path to the HTML file
   * @param {string} targetSelector - CSS selector of the target element
   */
  static async loadComponent(path, targetSelector) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${path}`);
      }
      const html = await response.text();
      const target = document.querySelector(targetSelector);
      if (target) {
        target.insertAdjacentHTML('beforeend', html);
        return true;
      } else {
        console.warn(`Target selector not found: ${targetSelector}`);
        return false;
      }
    } catch (error) {
      console.error('Error loading component:', error);
      return false;
    }
  }

  /**
   * Load multiple components
   * @param {Array} components - Array of {path, target} objects
   */
  static async loadComponents(components) {
    const promises = components.map(comp => 
      this.loadComponent(comp.path, comp.target)
    );
    return Promise.all(promises);
  }
}