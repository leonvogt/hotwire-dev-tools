## Architecture Overview
The extension uses an agent-based architecture that centralizes debugging functionality. Here's how the pieces fit together:


┌─────────────────┐     ┌───────────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────┐
│                 │     │               │     │             │     │              │     │           │
│  DevTools Panel │◄────┤  Background   │◄────┤    Proxy    │◄────┤    Agent     │◄────┤  Alpine   │
│      (UI)       │────►│    Script     │────►│   Script    │────►│   Script     │────►│  Runtime  │
│                 │     │               │     │             │     │              │     │           │
└─────────────────┘     └───────────────┘     └─────────────┘     └──────────────┘     └───────────┘

**Key** Components
1. DevTools Panel (panel.js, panel.html)
The user interface displayed in Chrome DevTools that allows developers to:

- View Alpine.js components
- Inspect component data
- Edit component properties
- View directives and other metadata
- This communicates with the background script via chrome.runtime.connect().

2.  Background Script (background.js)
Acts as a message router between the DevTools panel and content scripts:

- Maintains connections for each tab
- Routes messages between the DevTools panel and the proxy script
- Handles connection lifecycle events

3. Proxy Script (proxy.js)
Injected as a content script, it:

- Connects to the background script using chrome.runtime.connect()
- Injects the agent script into the page
- Forwards messages between the agent and DevTools panel
- Crosses Chrome's extension/page context boundary

4. Agent Script (agent.js)
The core of the debugging functionality:
- Finds Alpine.js components in the page
- Accesses component data using Alpine.$data()
- Observes DOM mutations for new components
- Updates components when instructed by the DevTools panel

5. Detector Script (detector.js)
- Determines if Alpine.js is present on the page and injects the proxy script if needed.

## Communication Flow
**Detection & Initialization:**
- Detector script finds Alpine.js on the page
- Proxy script is injected, which injects the agent script
- Agent announces its presence with an AGENT_READY message

**Component Discovery:**
- Agent scans the DOM for elements with x-data attributes
- Extracts component data and directives
- Sends this information to the DevTools panel via the proxy and background scripts

**User Interaction:**
- User selects a component in the DevTools panel
- Panel sends an INSPECT_COMPONENT message
- Agent highlights the component in the page

**Data Modification:**
- User edits a component property in the DevTools panel
- Panel sends an EDIT_COMPONENT message with the new value
- Agent updates the component data in the Alpine.js context
- Changes are reflected in the UI

**Reactivity:**
- Agent uses a MutationObserver to watch for DOM changes
- When new Alpine components are detected, they are automatically added to the panel

**Message Types**
- The extension uses a standardized message format to communicate between components:

- AGENT_READY: Sent when the agent is initialized
- GET_COMPONENTS: Request to scan for Alpine.js components
- COMPONENTS_UPDATED: Contains the list of discovered components
- INSPECT_COMPONENT: Request to highlight a specific component
- EDIT_COMPONENT: Request to modify component data
- COMPONENT_UPDATED: Notification that a component's data has changed

## Getting Started
- Clone the repository
- Run npm install to install dependencies
- Run npm run dev to build the extension in development mode
- Load the unpacked extension in Chrome from the dist directory
- Open DevTools and look for the "Alpine.js" panel


Manifest
```json
{
  "name": "Alpine.js DevTools",
  "version": "1.0.0",
  "description": "Browser DevTools extension for debugging Alpine.js applications",
  "manifest_version": 3,
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "Alpine.js DevTools"
  },
  "background": {
    "service_worker": "background.js"
  },
  "devtools_page": "devtools.html",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["scripts/detector.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "web_accessible_resources": [
    {
      "resources": ["scripts/agent.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

1. Agent Script (Injected in Page)

```js
window.__ALPINE_DEVTOOLS_AGENT__ = {
  components: new Map(),
  listeners: new Set(),
  
  // Initialize the agent
  init() {
    this.setupMutationObserver();
    this.scanForComponents();
    
    // Listen for messages from DevTools panel
    window.addEventListener('message', event => {
      if (event.data && event.data.source === 'alpine-devtools-panel') {
        this.handleCommand(event.data.payload);
      }
    });
    
    // Announce presence to DevTools
    this.notifyDevTools({type: 'AGENT_READY', alpine: !!window.Alpine});
  },
  
  // Watch for DOM changes to detect new Alpine components
  setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      let componentChanged = false;
      
      for (let mutation of mutations) {
        if (mutation.target.hasAttribute && 
            (mutation.target.hasAttribute('x-data') || 
             mutation.target.querySelector('[x-data]'))) {
          componentChanged = true;
          break;
        }
      }
      
      if (componentChanged) {
        this.scanForComponents();
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
  },
  
  // Discover Alpine components
  scanForComponents() {
    // Clear previous components
    this.components.clear();
    
    // Find and register all Alpine components
    document.querySelectorAll('[x-data]').forEach(el => {
      const componentId = this.generateId(el);
      const componentData = window.Alpine.$data(el);
      const name = el.getAttribute('x-data') || el.id || 'Anonymous Component';
      
      this.components.set(componentId, {
        id: componentId,
        name: name,
        el,
        data: componentData,
        // Extract more metadata like directives, etc.
        directives: this.extractDirectives(el)
      });
    });
    
    this.notifyDevTools({
      type: 'COMPONENTS_UPDATED', 
      components: Array.from(this.components.values(), comp => ({
        id: comp.id,
        name: comp.name,
        data: this.serializeData(comp.data),
        directives: comp.directives
      }))
    });
  },
  
  // Generate unique ID for components
  generateId(el) {
    if (!el.__alpine_devtools_id) {
      el.__alpine_devtools_id = `alpine-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    return el.__alpine_devtools_id;
  },
  
  // Extract x-directives from an element
  extractDirectives(el) {
    const directives = [];
    for (const attr of el.attributes) {
      if (attr.name.startsWith('x-') && attr.name !== 'x-data') {
        directives.push({
          name: attr.name,
          value: attr.value
        });
      }
    }
    return directives;
  },
  
  // Make data serializable for messaging
  serializeData(data) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (e) {
      return {
        __error: "Data contains circular references or non-serializable values"
      };
    }
  },
  
  // Bridge to DevTools
  notifyDevTools(message) {
    window.postMessage({
      source: 'alpine-devtools-agent',
      payload: message
    }, '*');
  },
  
  // Handle incoming commands from DevTools
  handleCommand(cmd) {
    switch(cmd.type) {
      case 'GET_COMPONENTS':
        this.scanForComponents();
        break;
        
      case 'INSPECT_COMPONENT':
        const component = this.components.get(cmd.id);
        if (component) {
          // Highlight the component in the page
          const prevOutline = component.el.style.outline;
          component.el.style.outline = '2px solid #4285F4';
          setTimeout(() => {
            component.el.style.outline = prevOutline;
          }, 1500);
        }
        break;
        
      case 'EDIT_COMPONENT':
        const targetComp = this.components.get(cmd.id);
        if (targetComp) {
          // Update nested property using path
          const pathParts = cmd.path.split('.');
          let current = targetComp.data;
          
          // Navigate to the parent object
          for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
            if (current === undefined) return;
          }
          
          // Update the value
          current[pathParts[pathParts.length - 1]] = cmd.value;
          
          // Notify about the update
          this.notifyDevTools({
            type: 'COMPONENT_UPDATED',
            id: cmd.id,
            data: this.serializeData(targetComp.data)
          });
        }
        break;
    }
  }
};

// Initialize the agent
window.__ALPINE_DEVTOOLS_AGENT__.init();
```

Proxy Script
```js
function proxy() {
  // Connect to the background script
  const proxyPort = chrome.runtime.connect({
    name: 'ALPINE_DEVTOOLS_PROXY'
  });

  // Forward messages from page to DevTools
  window.addEventListener('message', event => {
    if (event.data && event.data.source === 'alpine-devtools-agent') {
      proxyPort.postMessage(event.data.payload);
    }
  });

  // Forward messages from DevTools to page
  proxyPort.onMessage.addListener(message => {
    window.postMessage({
      source: 'alpine-devtools-panel',
      payload: message
    }, '*');
  });
  
  // Inject agent script into page
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('scripts/agent.js');
  document.documentElement.appendChild(script);
  script.onload = function() {
    script.remove();
  };
}

proxy();
```

DevToolsPanel
```js
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// DevTools Panel UI Component
function AlpineDevToolsPanel() {
  const [connected, setConnected] = useState(false);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState({});
  
  useEffect(() => {
    // Create connection to the background page
    const port = chrome.runtime.connect({
      name: 'ALPINE_DEVTOOLS_PANEL'
    });
    
    // Listen for messages from the agent (via background)
    port.onMessage.addListener(message => {
      switch(message.type) {
        case 'AGENT_READY':
          setConnected(true);
          // Request components list
          sendCommand({ type: 'GET_COMPONENTS' });
          break;
          
        case 'COMPONENTS_UPDATED':
          setComponents(message.components);
          break;
          
        case 'COMPONENT_UPDATED':
          setComponents(prevComponents => 
            prevComponents.map(comp => 
              comp.id === message.id ? { ...comp, data: message.data } : comp
            )
          );
          break;
      }
    });
    
    // Function to send commands to the agent
    function sendCommand(command) {
      port.postMessage(command);
    }
    
    // Store sendCommand in a global for the component to use
    window.__sendCommand = sendCommand;
    
    // Clean up on unmount
    return () => {
      delete window.__sendCommand;
      port.disconnect();
    };
  }, []);
  
  // Send command to the agent
  const sendCommand = (command) => {
    window.__sendCommand(command);
  };
  
  // Toggle expanded state for an object property
  const togglePath = (path) => {
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  // Render a data property with editing capability
  const renderDataProperty = (data, path, depth = 0) => {
    if (data === null) return <span className="null">null</span>;
    
    const dataType = typeof data;
    
    // Handle primitive types
    if (dataType !== 'object' || data === null) {
      return (
        <div className="property">
          <span className="property-name">{path.split('.').pop()}: </span>
          <span className="property-value" onClick={() => {
            const newValue = prompt("Edit value:", data);
            if (newValue !== null) {
              sendCommand({
                type: 'EDIT_COMPONENT',
                id: selectedComponent.id,
                path: path,
                value: dataType === 'number' ? parseFloat(newValue) : newValue
              });
            }
          }}>
            {dataType === 'string' ? `"${data}"` : String(data)}
          </span>
        </div>
      );
    }
    
    // Handle objects and arrays
    const isExpanded = expandedPaths[path];
    const isArray = Array.isArray(data);
    
    return (
      <div className="object-property">
        <div 
          className="property-name expandable" 
          onClick={() => togglePath(path)}
        >
          {path.split('.').pop()}: {isArray ? '[]' : '{}'} 
          <span className="expander">{isExpanded ? '▼' : '►'}</span>
        </div>
        
        {isExpanded && (
          <div className="object-children" style={{ marginLeft: '20px' }}>
            {Object.keys(data).map(key => (
              <div key={key}>
                {renderDataProperty(data[key], `${path}.${key}`, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // If not connected, show loading state
  if (!connected) {
    return <div className="connecting">Connecting to Alpine.js...</div>;
  }
  
  return (
    <div className="alpine-devtools-panel">
      <div className="components-list">
        <h2>Alpine.js Components</h2>
        {components.length === 0 ? (
          <p>No Alpine.js components found</p>
        ) : (
          <ul>
            {components.map(component => (
              <li 
                key={component.id} 
                className={selectedComponent?.id === component.id ? 'selected' : ''} 
                onClick={() => {
                  setSelectedComponent(component);
                  sendCommand({
                    type: 'INSPECT_COMPONENT',
                    id: component.id
                  });
                }}
              >
                {component.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {selectedComponent && (
        <div className="component-details">
          <h2>{selectedComponent.name}</h2>
          
          <div className="component-directives">
            <h3>Directives</h3>
            {selectedComponent.directives.map(dir => (
              <div key={dir.name} className="directive">
                <span className="directive-name">{dir.name}:</span>
                <span className="directive-value">{dir.value}</span>
              </div>
            ))}
          </div>
          
          <div className="component-data">
            <h3>Data</h3>
            <div className="data-tree">
              {Object.keys(selectedComponent.data).map(key => (
                <div key={key}>
                  {renderDataProperty(
                    selectedComponent.data[key], 
                    key
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount the DevTools panel
ReactDOM.render(
  <AlpineDevToolsPanel />,
  document.getElementById('app')
);
```

Extension Setup
```js
// Create DevTools panel
chrome.devtools.panels.create(
  "Alpine.js",
  "icons/icon-128.png",
  "panel.html",
  panel => {
    console.log("Alpine.js DevTools panel created");
  }
);
```

Panel
```
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Alpine.js DevTools Panel</title>
  <link rel="stylesheet" href="styles/panel.css">
</head>
<body>
  <div id="app"></div>
  <script src="panel.js"></script>
</body>
</html>
```

DevTools HTML page
```
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Alpine.js DevTools</title>
  <script src="scripts/devtools-main.js"></script>
</head>
<body>
  <!-- This page is required for creating a DevTools panel -->
</body>
</html>
```

Dectect script
```js
// This script detects if Alpine.js is present and injects the proxy script if needed

// Function to check for Alpine.js
function detectAlpine() {
  return window.Alpine !== undefined || 
         document.querySelector('[x-data]') !== null;
}

// Check if Alpine.js is on the page
if (detectAlpine()) {
  // Alpine.js detected, inject the proxy script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('scripts/proxy.js');
  document.documentElement.appendChild(script);
  script.onload = function() {
    script.remove();
  };
}

// Also check after a delay in case Alpine loads after our script
setTimeout(() => {
  if (detectAlpine()) {
    // Only inject if not already done
    if (!document.querySelector('script[src*="proxy.js"]')) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('scripts/proxy.js');
      document.documentElement.appendChild(script);
      script.onload = function() {
        script.remove();
      };
    }
  }
}, 2000);
```


BAckground Script
```js
// Map of tabId -> port connections
const connections = {};

// Handle connections from devtools panel
chrome.runtime.onConnect.addListener(port => {
  // Assign port to the correct namespace
  if (port.name === 'ALPINE_DEVTOOLS_PANEL') {
    // This connection is from the devtools panel
    const devToolsListener = message => {
      // Extract tabId from the connection name
      const tabId = port.sender.tab ? port.sender.tab.id : port.name.split('_')[3];
      
      // Forward message to the content script in the inspected window
      if (tabId && connections[tabId]) {
        connections[tabId].postMessage(message);
      }
    };
    
    port.onMessage.addListener(devToolsListener);
    
    port.onDisconnect.addListener(() => {
      port.onMessage.removeListener(devToolsListener);
    });
    
    return;
  }
  
  if (port.name === 'ALPINE_DEVTOOLS_PROXY') {
    // This is from the content script
    const tabId = port.sender.tab.id;
    
    // Save the connection
    connections[tabId] = port;
    
    const proxyListener = message => {
      // Forward to all devtools panels
      chrome.runtime.sendMessage({
        source: 'alpine-devtools-background',
        tabId: tabId,
        payload: message
      });
    };
    
    port.onMessage.addListener(proxyListener);
    
    port.onDisconnect.addListener(() => {
      port.onMessage.removeListener(proxyListener);
      delete connections[tabId];
    });
  }
});
```
