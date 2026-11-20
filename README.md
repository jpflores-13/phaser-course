# Phaser Course

Source of the course site <https://jpflores-13.github.io/phaser-course>: a
hands-on course in 2D browser games with Phaser 4.2.1, for people who already
code in R or Python. Learners build one game, *Cold Chain*, across three half
days, then read a real game from Minus 80 Studios.

Lessons are CC BY 4.0 (`LICENSE`), code is MIT (`LICENSE-code`), and the art
and sound in `assets/` are CC0. Author: JP Flores.

## Taking the course

Start at the [setup page](https://jpflores-13.github.io/phaser-course/setup.html).
In short:

```bash
git clone https://github.com/jpflores-13/phaser-course.git
cd phaser-course
cp -r starter my-cold-chain
cd my-cold-chain
npm install
npm run dev
```

## Build the site

You need [Quarto](https://quarto.org) 1.9 or later and Node.js 26.

```bash
npm install               # Phaser and Vite, for building the demos
quarto preview            # live preview, re-renders on save
quarto render             # full build into _site/
quarto render lessons/02-first-scene.qmd   # one page (and its slides)
```

`quarto render` first runs `_scripts/build-demos.mjs`, which builds every game
folder into `_demos/` (skipping ones that haven't changed). The rendered site
goes to `_site/`, which is not committed: GitHub Actions builds and publishes
it on every push to `main` (`.github/workflows/publish.yml`).

## How the pieces fit

### Pages and slides from one file

Each lesson in `lessons/` renders twice, as a web page and as reveal.js
slides. Each `##` heading is a slide. Longer explanations sit inside
`::: {.content-hidden when-format="revealjs"}` so they appear on the page only.

### Code from the real files

```markdown
{{< snippet file="stopping-points/stopC/src/scenes/Play.js" method="pickUp" >}}
{{< snippet file="stopping-points/stopA/src/main.js" lines="1-20" >}}
```

`_extensions/snippet/` pulls code straight out of the game files, so the code
on a page is code that runs. A missing file or method shows a warning box.

### Playable games

```markdown
{{< game stopping-points/stopA >}}
{{< game solutions/02/ex-2.1 caption="The tube on the bench" >}}
```

`_extensions/game/` embeds the built game from `_demos/` in a page or slide.

### Game folders

| Folder | What it is |
|---|---|
| `starter/` | An empty game. Learners copy it to `my-cold-chain/` |
| `stopping-points/stopA` … `stopE` | *Cold Chain* at the end of each block. `stopE` is the finished game |
| `solutions/NN/ex-N.M/` | A runnable answer to a "Build it" exercise |

Every game folder is a complete Vite project with its own `package.json`, so
learners can copy any of them and run `npm install && npm run dev`.

### Art, maps and sound

`_scripts/make_assets.py` draws every sprite and tile, builds both Tiled maps
and synthesises the sound effects. It writes `assets/` and copies it into
`public/assets/` of every game folder:

```bash
python3 _scripts/make_assets.py    # needs Pillow and NumPy
```

Edit the maps in Tiled (`assets/maps/*.tmj`) or in the script, but not both:
running the script overwrites the maps.
