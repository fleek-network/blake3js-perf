import json
from manim import *
from fleek import *

class BarChartExample(Scene):
    def construct(self):
        chart = BarChart(
            values=[
                61,
                404,
                892
            ],
            bar_names=[
                "Sha256",
                "WASM (Rust)",
                "JavaScript"
            ],
            y_length=6,
            x_length=10,
            x_axis_config={
                "font_size": 24,
                "label_constructor": Text
            },
            y_axis_config={
                "font_size": 24,
                "label_constructor": lambda x: Text(x),
                "decimal_number_config": {
                    "unit": r"\text{MB/s}",
                    "num_decimal_places": 0,
                    # "mob_class": Text
                }
            },
            bar_colors=[
                RED.to_hex(),
                BLUE.to_hex(),
                YELLOW.to_hex(),
                GREEN.to_hex()
            ]
        )

        c_bar_lbls = chart.get_bar_labels(font_size=48, label_constructor=Text)

        self.add(chart, c_bar_lbls)
