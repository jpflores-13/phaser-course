--[[
game: embed a playable build of a course game in a page or a slide.

  {{< game stopping-points/stopA >}}
  {{< game stopping-points/stopC debug="true" >}}
  {{< game solutions/02/ex-2.1 caption="The tube on the bench" >}}
  {{< game stopping-points/stopE id="tuning-game" >}}

Every game folder is built into _demos/<folder>/ before the render
(_scripts/build-demos.mjs), and _demos/ is copied into the site.

Arguments
  (first)   the game folder, from the repository root
  debug     "true" to draw the physics bodies (adds ?debug)
  caption   text under the game (pages only)
  id        an id for the iframe, so a page script can talk to the game
]]

local function str(v)
  if v == nil then return nil end
  local s = pandoc.utils.stringify(v)
  if s == "" then return nil end
  return s
end

local function escape(s)
  return (s:gsub("&", "&amp;"):gsub('"', "&quot;"):gsub("<", "&lt;"):gsub(">", "&gt;"))
end

local function game(args, kwargs, meta)
  local folder = str(args[1]) or str(kwargs["folder"])
  if not folder then
    quarto.log.warning("game: needs a folder, e.g. {{< game stopping-points/stopA >}}")
    return pandoc.Null()
  end
  folder = folder:gsub("/+$", "")

  local offset = (quarto.project and quarto.project.offset) or "."
  local src = offset .. "/_demos/" .. folder .. "/index.html"
  if str(kwargs["debug"]) == "true" then src = src .. "?debug" end

  local id = str(kwargs["id"])
  local caption = str(kwargs["caption"]) or "Click the game, then use the arrow keys or WASD."
  local title = "Playable game: " .. folder

  local html = '<div class="game-embed">'
    .. '<div class="game-frame"><iframe'
    .. (id and (' id="' .. escape(id) .. '"') or "")
    .. ' src="' .. escape(src) .. '" title="' .. escape(title) .. '" loading="lazy" allow="autoplay; fullscreen"></iframe></div>'
    .. '<div class="game-bar"><span>' .. escape(caption) .. '</span>'
    .. '<a href="' .. escape(src) .. '" target="_blank" rel="noopener">Open in a new tab</a></div>'
    .. '</div>'
  return pandoc.RawBlock("html", html)
end

return {
  ["game"] = game,
}
