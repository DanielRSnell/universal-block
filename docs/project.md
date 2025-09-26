# 📦 blocklibname-element
icon: 'editor-code',
attributes: {
elementType: { type: 'string', default: 'text' },
tagName: { type: 'string', default: 'p' },
globalAttrs: { type: 'object', default: {} },
content: { type: 'string' },
href: { type: 'string' }, target: { type: 'string', default: '' }, rel: { type: 'string', default: '' },
src: { type: 'string' }, alt: { type: 'string' }, width: { type: 'number' }, height: { type: 'number' },
selfClosing: { type: 'boolean', default: false }
},
edit: Edit,
save: () => null, // dynamic
transforms
});
```


---


## src/style.css (intentionally empty)


```css
/* Intentionally empty — designless. Styles come from theme. */
```


---


## package.json (build tooling)


```json
{
"name": "blocklibname-element",
"version": "0.1.0",
"private": true,
"devDependencies": {
"@wordpress/scripts": "^28.5.0"
},
"scripts": {
"build": "wp-scripts build src/index.js --output-path=build",
"start": "wp-scripts start src/index.js --output-path=build"
}
}
```


> Produces `build/index.js` consumed by `block.json`.


---


## README.md (quick start)


```md
# BlockLib Element (Designless Polymorphic Block)


## Install
1. Copy the `blocklibname-element` folder into `wp-content/plugins/`.
2. `cd blocklibname-element && npm install && npm run build`
3. Activate **BlockLib Element** in WP Admin → Plugins.


## Use
- Insert **Element** block.
- Pick **Type** (Text, Heading, Link, Image, Rule, Container).
- Adjust **Tag** and set only the attributes you need (href, src, alt, id, class, style, role, aria-*, data-*).
- No styles are injected; your theme handles the look.


## HTML Pasting
- Paste raw HTML directly into the editor. The block will attempt to map tags/attrs into its attributes via the `raw` transform.


## Transforms
- From core: paragraph, heading, separator, button, image → Element.
- To core: Element → the nearest equivalent core block.


## Notes
- Dynamic (server-rendered). No wrapper elements.
- Container type supports nested content (InnerBlocks).
- Accessibility is on you: set `alt` for images, meaningful link text, logical heading order.
```


---


## .editorconfig


```ini
root = true


[*]
charset = utf-8
indent_style = tab
indent_size = 4
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```


---


## .gitignore


```
/node_modules
/build
.DS_Store
