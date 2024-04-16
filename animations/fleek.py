import manim
import os

FONT_NAME = "IBM Plex Mono"
TITLE_FONT_NAME = "Atyp Display"
FONT_SIZE = 12
YELLOW = manim.ManimColor("#FFE702")
RED = manim.ManimColor("#F45BCE")
BLUE = manim.ManimColor("#00D3FF")
GREEN = manim.ManimColor("#57FF59")

def Text(text, color=None, font_size=manim.DEFAULT_FONT_SIZE):
    return manim.Text(text, color=color, font_size=font_size, font=FONT_NAME, weight=manim.LIGHT)

def Title(text, color=None, font_size=manim.DEFAULT_FONT_SIZE):
    return manim.Text(text, color=color, font_size=font_size, font=FONT_NAME, weight=manim.MEDIUM)

def Code(
    file_name: str | os.PathLike | None = None,
    code: str | None = None,
    tab_width: int = 3,
    line_spacing: float = 0.3,
    font_size: float = 24,
    font: str = FONT_NAME,
    stroke_width: float = 0,
    margin: float = 0.3,
    indentation_chars: str = "    ",
    background: str = "rectangle",  # or window
    background_stroke_width: float = 1,
    background_stroke_color = "#FFFFFF",
    corner_radius: float = 0.2,
    insert_line_no: bool = True,
    line_no_from: int = 1,
    line_no_buff: float = 0.4,
    style: str = "vim",
    language: str | None = None,
    generate_html_file: bool = False,
    warn_missing_font: bool = True,
    **kwargs,
):
    return manim.Code(
        file_name=file_name,
        code = code,
        tab_width=tab_width,
        line_spacing=line_spacing,
        font_size=font_size,
        font = font,
        stroke_width=stroke_width,
        margin=margin,
        indentation_chars=indentation_chars,
        background=background,
        background_stroke_width=background_stroke_width,
        background_stroke_color=background_stroke_color,
        corner_radius=corner_radius,
        insert_line_no=insert_line_no,
        line_no_from=line_no_from,
        line_no_buff=line_no_buff,
        style=style,
        language=language,
        generate_html_file=generate_html_file,
        warn_missing_font=warn_missing_font,
        **kwargs,
    )
