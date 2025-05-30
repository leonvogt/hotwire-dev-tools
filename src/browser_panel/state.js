export const [state, setState] = createStore({
  version: {},
  errors: [],
  components: {},
  preloadedComponentData: {},
})

export const setAlpineVersionFromBackend = (version) => {
  setState({
    version: {
      detected: version,
    },
  })
}

export const setComponentsList = (components, appUrl) => {}

export const setComponentData = (componentId, componentData) => {}

// TODO: rename this to `setAdditionalError`
export const renderError = (error) => {}

function withAllClosedComponents(components) {}

export function selectComponent(component) {}

export function toggleDataAttributeOpen(attribute) {}

export function saveAttributeEdit(editedAttr) {}

const setComponentFlattenedData = (selectedComponentId, newSelectedComponentFlattenedData) => {}
