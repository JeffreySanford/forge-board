# 📜 Guide: Instructing **GitHub Copilot** to Scaffold a *Marked-powered* Documentation Pipeline  

> **Goal** – Have Copilot generate (and then keep extending) a Node-based tool‑chain that  
> 1. Converts your 30+ Markdown docs into HTML,  
> 2. Replaces **all inline styles** with **utility class names**,
> 3. Plugs the result straight into your Angular + NX workspace at `assets/documentation/`, and
> 4. Supports automatic rebuilds with watch mode.

---

## 1 · Tell Copilot *what* & *why* up‑front — the prime prompt

Paste something like this at the **top of a new `docs-builder.mjs` file** (or in a Copilot chat tab) so Copilot has context for *every* future suggestion:

```js
/**
 * 🔔 Copilot, please scaffold the following:
 * – Use **marked** (https://github.com/markedjs/marked) as the core Markdown parser/render engine.
 * – Add the **marked-attributes** plug‑in so we can write `{.class}` directly in Markdown.
 * – Add a custom renderer hook that maps any existing `style="background-color:#002868"` etc.
 *   into class names: `.status-card.blue`, `.status-card.red`, `.status-card.gold`.
 * – Take any file under `assets/documentation/**/*.md`, run it through the pipeline below,
 *   and spit the HTML into `dist/docs/🗎same-name.html`.
 * – Make the script runnable via `npm run build:docs`.
 * – Keep everything ECMAScript Modules (mjs) and Node 18+.
 * – Include a `glob` import for file discovery and `fs/promises` for I/O.
 * – Respect NX workspace layout; do **not** break other builds.
 */
```

> **Why?** Copilot does best when you give it a *bullet‑proof, first‑person TODO list*.  
> It will autocompose the imports, write the glob loop, and even suggest the `package.json` scripts.

---

## 2 · Reference snippet Copilot can extrapolate from

Below the comment above, drop a **tiny skeleton** so Copilot “sees” your architectural taste:

```js
import { marked } from 'marked';
import attrs     from 'marked-attributes';
import { glob }  from 'glob';
import { readFile, writeFile } from 'node:fs/promises';

// 1 - configure Marked once
marked.use(attrs());
marked.setOptions({ gfm: true });

(async () => {
  // 2 - find all *.md docs
  const files = await glob('assets/documentation/**/*.md');

  for (const file of files) {
    const md   = await readFile(file, 'utf-8');
    const html = marked.parse(md);               // Copilot will suggest renderer hooks here
    const out  = 'dist/docs/' + file.replace(/^.+\//, '') + '.html';
    await writeFile(out, html);
  }
})();
```

Copilot will now automatically **fill in renderer overrides** (e.g., `renderer.code`, `renderer.heading`) and offer a block that turns inline-style colors into classes.

---

## 3 · Seed the class‑mapping logic (Copilot will finish)

Add the first rule yourself so Copilot understands the pattern:

```js
marked.use({
  renderer: {
    // Custom HTML transformation
    html(html) {
      return html
        .replace(/style="[^"]*#002868[^"]*"/g, 'class="status-card blue"')
        /* Copilot will suggest .red and .gold next 👇 */;
    }
  }
});
```

Type `/** TODO:` and Copilot will propose additional `.replace()` calls.  
Accept or tweak them. The AI will begin to offer **regexes that cover all your inline colors**.

---

## 4 · Ask Copilot for supporting files

* `documentation-theme.scss` with the `.status-card`, `.blue`, `.red`, `.gold` rules.  
* An **NX target** in `workspace.json`:
  ```jsonc
  "build-docs": {
    "executor": "@nrwl/workspace:run-commands",
    "options": {
      "command": "node tools/docs-builder.mjs"
    }
  }
  ```
* A **Husky pre‑commit hook** that runs `npm run lint:docs && prettier --write assets/documentation/**/*.md`.

Prompt Copilot plainly:

> *“Generate `documentation-theme.scss` and add NX command + Husky hook per above specs.”*

It will draft the files; you hit *Tab* to accept.

---

## 5 · Iteratively refine

Whenever you spot a new inline style:

1. **Add one example** in a comment (`/* map #ABCDEF to .purple */`)  
2. Start a new line; Copilot proposes the regex + class mapping.  
3. Accept → commit. Inline styles **disappear** incrementally.

---

## 6 · Summary boiler‑plate for your README

```markdown
### 🛠️ Docs Build

```bash
# install once
npm i -D marked marked-attributes glob

# one-off render
npm run build:docs

# watch-mode (optional)
nodemon --watch assets/documentation --exec "npm run build:docs"
```

The script transforms every Markdown file under `assets/documentation/` into class‑based, style‑free HTML under `dist/docs/`, ready for Angular to serve.  
Classes (`.status-card.*`) draw their look from `documentation-theme.scss`, keeping presentation and content cleanly separated.
```

---

## 7 · Pro‑tips for effective Copilot prompting

| ✅ Do | ❌ Don’t |
|------|---------|
| **Write imperative comments** (“Copilot, create a loop…”) | Bury intent in prose paragraphs |
| **Seed one working example** | Expect Copilot to invent your class map from scratch |
| **Keep prompts in‑file** so context sticks | Jump around files mid‑prompt (context evaporates) |
| **Review & tweak** suggestions – small edits retrain Copilot in situ | Accept giant blobs uncritically (bugs snowball) |

---

> **That’s it!** Save the primer above as `COPILOT_MARKED_SETUP.md`. Hand it to any teammate (or your future self), open the stub `docs-builder.mjs`, and Copilot will do the heavy lifting from there—*all while you keep full control of the pipeline.*
