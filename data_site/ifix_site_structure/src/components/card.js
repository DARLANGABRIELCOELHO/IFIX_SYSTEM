// card.js — Enhanced Card Component
// Follows CSS guidelines from README (section 5.6)

const Card = (function () {
  const VERSION = "3.0.0";
  
  /**
   * Render a Card component
   * @param {Object} options
   * @param {string} options.title - Card title
   * @param {string} options.subtitle - Card subtitle
   * @param {string|Node|Array<Node>} options.content - Main content
   * @param {string|Node|Array<Node>} options.actions - Actions area (in header)
   * @param {string|Node|Array<Node>} options.footer - Footer content
   * @param {string} options.className - Additional CSS classes (e.g., "card--outline")
   * @param {Function} options.onClick - Click handler for entire card
   * @param {string} options.id - Card element ID
   * @param {Object} options.data - Data attributes (key-value pairs)
   * @returns {HTMLElement} The card DOM element
   */
  function render({
    title = "",
    subtitle = "",
    content = null,
    actions = null,
    footer = null,
    className = "",
    onClick = null,
    id = null,
    data = {}
  } = {}) {
    const card = document.createElement("div");
    card.className = `card ${className}`.trim();
    
    if (id) card.id = id;
    
    // Add click handler if provided
    if (onClick && typeof onClick === "function") {
      card.style.cursor = "pointer";
      card.addEventListener("click", onClick);
    }
    
    // Add data attributes
    Object.entries(data).forEach(([key, value]) => {
      card.setAttribute(`data-${key}`, value);
    });

    // --- Header ---
    const header = document.createElement("div");
    header.className = "card-header";
    
    // Titles container
    const titlesContainer = document.createElement("div");
    if (title) {
      const titleEl = document.createElement("div");
      titleEl.className = "card-title";
      titleEl.textContent = title; // Safe: textContent
      titlesContainer.appendChild(titleEl);
    }
    if (subtitle) {
      const subtitleEl = document.createElement("div");
      subtitleEl.className = "card-subtitle";
      subtitleEl.textContent = subtitle; // Safe: textContent
      titlesContainer.appendChild(subtitleEl);
    }
    header.appendChild(titlesContainer);
    
    // Actions area
    if (actions) {
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "card-actions";
      setContent(actionsContainer, actions);
      header.appendChild(actionsContainer);
    }
    
    card.appendChild(header);

    // --- Body ---
    if (content !== null) {
      const body = document.createElement("div");
      body.className = "card-body";
      setContent(body, content);
      card.appendChild(body);
    }

    // --- Footer ---
    if (footer) {
      const footerEl = document.createElement("div");
      footerEl.className = "card-footer";
      setContent(footerEl, footer);
      card.appendChild(footerEl);
    }

    return card;
  }

  /**
   * Safely set content into a container element
   * @param {HTMLElement} targetEl - Container element
   * @param {string|Node|Array<Node>} content - Content to insert
   */
  function setContent(targetEl, content) {
    targetEl.innerHTML = "";
    
    if (!content) return;
    
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (item instanceof Node) {
          targetEl.appendChild(item);
        } else if (typeof item === "string") {
          const wrapper = document.createElement("div");
          wrapper.textContent = item; // Safe: textContent
          targetEl.appendChild(wrapper);
        }
      });
      return;
    }
    
    if (content instanceof Node) {
      targetEl.appendChild(content);
      return;
    }
    
    // String content (safe via textContent)
    const wrapper = document.createElement("div");
    wrapper.textContent = String(content);
    targetEl.appendChild(wrapper);
  }

  return {
    render,
    version: VERSION
  };
})();

// Export for ES Modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Card;
} else if (typeof define === "function" && define.amd) {
  define([], () => Card);
} else {
  window.Card = Card;
}