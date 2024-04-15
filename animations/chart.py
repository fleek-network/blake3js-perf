import json
from manim import *

f = open("./bench.json")
data = json.load(f)

class BarChartExample(Scene):
    def construct(self):
        chart = BarChart(
            values=[

            ],
            bar_names=[
                "Sha"
            ],
            # y_range=[],
            y_length=6,
            x_length=10,
            x_axis_config={"font_size": 36},
        )

        c_bar_lbls = chart.get_bar_labels(font_size=48)

        self.add(chart, c_bar_lbls)
