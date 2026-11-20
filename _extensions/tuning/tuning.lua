--[[
tuning: sliders and switches that change a running Cold Chain game.

  {{< tuning target="tuning-game" sliders="thaw.perSecond:2:20:1, carts.speedScale:0.3:2.5:0.1" >}}
  {{< tuning target="feel-game" switches="feel.shake, feel.particles, feel.tweens" >}}

The game must be embedded with the same id: {{< game stopping-points/stopE id="tuning-game" >}}.
Messages go through window.postMessage to src/tuning-bridge.js in the game,
which only accepts them from the same site. Pages only; nothing on slides.

Arguments
  target    the id of the game's iframe
  sliders   comma-separated path:min:max:step (the starting value is read from the game's defaults below)
  switches  comma-separated paths of true/false settings
]]

-- defaults from stopping-points/stopE/src/tuning.js, so the controls start where the game does
local DEFAULTS = {
  ["player.maxSpeed"] = 220, ["player.acceleration"] = 1400, ["player.drag"] = 1800,
  ["player.spillDrag"] = 90, ["thaw.perSecond"] = 7, ["thaw.bumpPenalty"] = 15,
  ["thaw.dryIceBonus"] = 40, ["carts.speedScale"] = 1, ["carts.extraPerDelivery"] = 1,
  ["carts.knockback"] = 320, ["feel.hitStopMs"] = 70,
  ["feel.shake"] = true, ["feel.particles"] = true, ["feel.tweens"] = true,
}

local function str(v)
  if v == nil then return nil end
  local s = pandoc.utils.stringify(v)
  if s == "" then return nil end
  return s
end

local function split(s, sep)
  local out = {}
  for part in (s .. sep):gmatch("(.-)" .. sep) do
    part = part:gsub("^%s+", ""):gsub("%s+$", "")
    if part ~= "" then out[#out + 1] = part end
  end
  return out
end

local function tuning(args, kwargs, meta)
  if not quarto.doc.is_format("html") then return pandoc.Null() end
  local target = str(kwargs["target"]) or "tuning-game"
  local rows = {}
  for _, spec in ipairs(split(str(kwargs["sliders"]) or "", ",")) do
    local path, min, max, step = spec:match("^([%w%.]+):([%d%.]+):([%d%.]+):([%d%.]+)$")
    if path then
      local value = DEFAULTS[path] or min
      rows[#rows + 1] = string.format(
        '<label><span class="tuning-name"><code>%s</code></span>'
        .. '<input type="range" data-path="%s" min="%s" max="%s" step="%s" value="%s" data-default="%s">'
        .. '<output>%s</output></label>', path, path, min, max, step, value, value, value)
    else
      quarto.log.warning("tuning: can't read slider '" .. spec .. "' (use path:min:max:step)")
    end
  end
  for _, path in ipairs(split(str(kwargs["switches"]) or "", ",")) do
    local on = DEFAULTS[path] ~= false
    rows[#rows + 1] = string.format(
      '<label><span class="tuning-name"><code>%s</code></span>'
      .. '<input type="checkbox" data-path="%s"%s data-default="%s"><output>%s</output></label>',
      path, path, on and " checked" or "", on and "true" or "false", on and "on" or "off")
  end

  quarto.doc.add_html_dependency({
    name = "tuning-panel",
    version = "0.1.0",
    scripts = { "tuning.js" },
  })

  local html = '<div class="tuning-panel" data-target="' .. target .. '">'
    .. table.concat(rows, "")
    .. '<div class="tuning-buttons"><button type="button" data-action="reset">Reset values</button>'
    .. '<button type="button" data-action="restart">Restart the game</button></div></div>'
  return pandoc.RawBlock("html", html)
end

return { ["tuning"] = tuning }
