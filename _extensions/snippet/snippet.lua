--[[
snippet: show real game code in a page, pulled from the file itself, so the
code on the page is always code that runs.

  {{< snippet file="stopping-points/stopC/src/scenes/Play.js" method="pickUp" >}}
  {{< snippet file="stopping-points/stopE/src/scenes/Play.js" method="create" >}}
  {{< snippet file="stopping-points/stopA/src/main.js" >}}
  {{< snippet file="stopping-points/stopB/src/scenes/Play.js" lines="40-60" >}}

Arguments
  file      path from the repository root
  method    a method or function name: from `name(` to its closing brace,
            plus the comment lines directly above it
  class     a class name, the whole class
  lines     "10-40", "10-" or "10" instead of a name
  comments  "false" to leave out the comment lines above a method
  lang      override the language (default: from the file extension)
  filename  override the label above the block (default: the path)

A missing file or name renders a visible warning box (and a render warning)
instead of stopping the render.
]]

local COURSE_REPO = "https://github.com/jpflores-13/phaser-course/blob/main/"

local function with_filename(code, filename)
  if not filename or not quarto.doc.is_format("html") then return code end
  local bar = pandoc.Div({ pandoc.Plain({
    pandoc.RawInline("html", "<pre>"),
    pandoc.Strong({ pandoc.Str(filename) }),
    pandoc.RawInline("html", "</pre>"),
  }) }, pandoc.Attr("", { "code-with-filename-file" }))
  return pandoc.Div({ bar, code }, pandoc.Attr("", { "code-with-filename" }))
end

local function str(v)
  if v == nil then return nil end
  local s = pandoc.utils.stringify(v)
  if s == "" then return nil end
  return s
end

local function project_dir()
  if quarto.project and quarto.project.directory then
    return quarto.project.directory
  end
  return pandoc.system.get_working_directory()
end

local function warn_block(msg)
  quarto.log.warning("snippet: " .. msg)
  return quarto.Callout({
    type = "warning",
    title = "Snippet not found",
    content = { pandoc.Para({ pandoc.Str(msg) }) },
    appearance = "simple",
  })
end

local function read_lines(path)
  local fh = io.open(path, "r")
  if not fh then return nil end
  local lines = {}
  for line in fh:lines() do
    lines[#lines + 1] = (line:gsub("\r$", ""))
  end
  fh:close()
  return lines
end

local function lang_for(file)
  local ext = (file:match("%.([^./]+)$") or ""):lower()
  local map = {
    js = "javascript", mjs = "javascript", ts = "typescript", json = "json", tmj = "json",
    html = "html", css = "css", yml = "yaml", yaml = "yaml", sh = "bash", py = "python",
  }
  return map[ext] or "default"
end

local function indent_of(line)
  return #(line:match("^(%s*)"):gsub("\t", "  "))
end

local function is_blank(line) return line:match("^%s*$") ~= nil end

local function escape_pattern(s)
  return (s:gsub("([%^%$%(%)%%%.%[%]%*%+%-%?])", "%%%1"))
end

-- Find a method, function or class by name. JavaScript in this course is
-- formatted by Prettier, so a block ends at the first `}` line with the same
-- indentation as its first line.
local function find_block(lines, name, kind, with_comments)
  local esc = escape_pattern(name)
  local patterns
  if kind == "class" then
    patterns = { "^%s*export%s+class%s+" .. esc .. "[%s{]", "^%s*class%s+" .. esc .. "[%s{]" }
  else
    patterns = {
      "^%s*" .. esc .. "%s*%(",                         -- method(
      "^%s*async%s+" .. esc .. "%s*%(",                 -- async method(
      "^%s*export%s+function%s+" .. esc .. "%s*%(",     -- export function name(
      "^%s*function%s+" .. esc .. "%s*%(",              -- function name(
      "^%s*export%s+const%s+" .. esc .. "%s*=",         -- export const name =
      "^%s*const%s+" .. esc .. "%s*=",                  -- const name =
    }
  end
  local start
  for i, line in ipairs(lines) do
    for _, pat in ipairs(patterns) do
      if line:match(pat) then start = i; break end
    end
    if start then break end
  end
  if not start then return nil end

  local base = indent_of(lines[start])
  local stop = start
  if not lines[start]:match("[{%[(]%s*$") and lines[start]:match(";%s*$") then
    stop = start -- a one-line const
  else
    for j = start + 1, #lines do
      local line = lines[j]
      if not is_blank(line) and indent_of(line) == base and line:match("^%s*[}%])]") then
        stop = j
        break
      end
    end
  end

  local first = start
  if with_comments then
    local k = start - 1
    while k >= 1 and lines[k]:match("^%s*//") and indent_of(lines[k]) == base do
      first = k
      k = k - 1
    end
  end
  return first, stop
end

local function parse_lines(spec, n)
  local a, b = spec:match("^%s*(%d+)%s*%-%s*(%d*)%s*$")
  if not a then
    a = spec:match("^%s*(%d+)%s*$")
    b = a
  end
  if not a then return nil end
  a = tonumber(a)
  b = (b == nil or b == "") and n or tonumber(b)
  if a < 1 then a = 1 end
  if b > n then b = n end
  if a > b then return nil end
  return a, b
end

local function dedent(chunk)
  local min
  for _, line in ipairs(chunk) do
    if not is_blank(line) then
      local ind = #line:match("^(%s*)")
      if not min or ind < min then min = ind end
    end
  end
  min = min or 0
  local out = {}
  for i, line in ipairs(chunk) do
    out[i] = is_blank(line) and "" or line:sub(min + 1)
  end
  while #out > 0 and out[#out] == "" do table.remove(out) end
  return out
end

local function snippet(args, kwargs, meta)
  local file = str(kwargs["file"]) or str(args[1])
  if not file then
    return warn_block("snippet needs file=")
  end
  local lines = read_lines(project_dir() .. "/" .. file)
  if not lines then
    return warn_block(file .. " does not exist (yet)")
  end

  local first, last
  local with_comments = str(kwargs["comments"]) ~= "false"
  local name = str(kwargs["method"]) or str(kwargs["class"])
  if str(kwargs["lines"]) then
    first, last = parse_lines(str(kwargs["lines"]), #lines)
    if not first then
      return warn_block("lines=\"" .. str(kwargs["lines"]) .. "\" is outside " .. file .. " (" .. #lines .. " lines)")
    end
  elseif name then
    first, last = find_block(lines, name, str(kwargs["class"]) and "class" or "method", with_comments)
    if not first then
      return warn_block("nothing named '" .. name .. "' in " .. file)
    end
  else
    first, last = 1, #lines
  end

  local chunk = {}
  for i = first, last do chunk[#chunk + 1] = lines[i] end
  chunk = dedent(chunk)
  last = first + #chunk - 1

  local lang = str(kwargs["lang"]) or lang_for(file)
  local label = str(kwargs["filename"]) or file
  local code = with_filename(pandoc.CodeBlock(table.concat(chunk, "\n"), pandoc.Attr("", { lang })), label)

  if not quarto.doc.is_format("html") then
    return code
  end
  local url = COURSE_REPO .. file .. "#L" .. first .. "-L" .. last
  local source = pandoc.Div(
    { pandoc.Plain({
        pandoc.Span({ pandoc.Str("lines " .. first .. "-" .. last) }, pandoc.Attr("", { "snippet-where" })),
        pandoc.Space(),
        pandoc.Link({ pandoc.Str("view in the course repository") }, url, "", pandoc.Attr("", { "snippet-link" })),
      }) },
    pandoc.Attr("", { "snippet-source" }))
  return pandoc.Div({ code, source }, pandoc.Attr("", { "snippet" }))
end

return {
  ["snippet"] = snippet,
}
