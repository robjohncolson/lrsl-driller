"""
Reading Regression Output (AP Stats Unit 9, Topic 9.2)

Shows a mock regression output table (Old Faithful example) with Predictor,
Coef, SE Coef, T, P columns. Highlights where to find b1 and SE(b1).

Run with: manim -qm --format=mp4 apstat_92_reading_output.py ReadingOutput
"""
from manim import *

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ReadingOutput(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Reading Regression Computer Output", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Old Faithful: Predicting interval from duration",
            font_size=22, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== BUILD THE TABLE ==========
        # Header row
        headers = ["Predictor", "Coef", "SE Coef", "T", "P"]
        header_texts = VGroup()
        col_positions = [-3.5, -1.5, 0.2, 1.8, 3.2]

        for i, h in enumerate(headers):
            t = Text(h, font_size=22, weight=BOLD, color=GRAY_A)
            t.move_to(RIGHT * col_positions[i] + UP * 0.8)
            header_texts.add(t)

        # Header underline
        header_line = Line(
            LEFT * 4.8 + UP * 0.55,
            RIGHT * 4.2 + UP * 0.55,
            color=GRAY, stroke_width=1.5,
        )

        # Constant row
        const_vals = ["Constant", "33.97", "1.201", "28.29", "0.000"]
        const_texts = VGroup()
        for i, v in enumerate(const_vals):
            t = Text(v, font_size=22)
            t.move_to(RIGHT * col_positions[i] + UP * 0.2)
            const_texts.add(t)

        # Duration row (slope row -- the important one)
        dur_vals = ["Duration", "13.29", "0.340", "39.09", "0.000"]
        dur_texts = VGroup()
        for i, v in enumerate(dur_vals):
            color = WHITE
            t = Text(v, font_size=22, color=color)
            t.move_to(RIGHT * col_positions[i] + DOWN * 0.3)
            dur_texts.add(t)

        # Extra info below the table
        extra_line = Line(
            LEFT * 4.8 + DOWN * 0.65,
            RIGHT * 4.2 + DOWN * 0.65,
            color=GRAY, stroke_width=1.5,
        )
        s_val = Text("s = 3.829      R-sq = 85.3%", font_size=20, color=GRAY_A)
        s_val.move_to(DOWN * 1.0)

        # Animate table appearance
        self.play(
            LaggedStart(*[Write(h) for h in header_texts], lag_ratio=0.1),
            Create(header_line),
            run_time=0.8,
        )
        self.play(
            LaggedStart(*[Write(c) for c in const_texts], lag_ratio=0.08),
            run_time=0.5,
        )
        self.play(
            LaggedStart(*[Write(d) for d in dur_texts], lag_ratio=0.08),
            run_time=0.5,
        )
        self.play(Create(extra_line), Write(s_val), run_time=0.4)
        self.wait(0.6)

        # ========== HIGHLIGHT b1 ==========
        b1_box = SurroundingRectangle(dur_texts[1], color=BLUE_3B1B, buff=0.1, corner_radius=0.05)
        b1_label = Text("b\u2081 = 13.29", font_size=26, color=ManimColor(BLUE_3B1B), weight=BOLD)
        b1_label.move_to(DOWN * 1.8 + LEFT * 2.5)

        b1_arrow = Arrow(
            b1_label.get_top(), dur_texts[1].get_bottom() + DOWN * 0.15,
            color=BLUE_3B1B, stroke_width=3, buff=0.1,
        )

        self.play(Create(b1_box), run_time=0.4)
        self.play(Write(b1_label), Create(b1_arrow), run_time=0.6)

        b1_desc = Text(
            "The sample slope: for each additional minute\nof duration, interval increases by 13.29 min",
            font_size=18, color=ManimColor(BLUE_3B1B),
        )
        b1_desc.next_to(b1_label, DOWN, buff=0.15)
        self.play(FadeIn(b1_desc), run_time=0.5)
        self.wait(0.8)

        # ========== HIGHLIGHT SE(b1) ==========
        se_box = SurroundingRectangle(dur_texts[2], color=PINK_3B1B, buff=0.1, corner_radius=0.05)
        se_label = Text("SE(b\u2081) = 0.340", font_size=26, color=ManimColor(PINK_3B1B), weight=BOLD)
        se_label.move_to(DOWN * 1.8 + RIGHT * 2.5)

        se_arrow = Arrow(
            se_label.get_top(), dur_texts[2].get_bottom() + DOWN * 0.15,
            color=PINK_3B1B, stroke_width=3, buff=0.1,
        )

        self.play(Create(se_box), run_time=0.4)
        self.play(Write(se_label), Create(se_arrow), run_time=0.6)

        se_desc = Text(
            "Standard error of the slope:\nmeasures precision of b\u2081",
            font_size=18, color=ManimColor(PINK_3B1B),
        )
        se_desc.next_to(se_label, DOWN, buff=0.15)
        self.play(FadeIn(se_desc), run_time=0.5)
        self.wait(0.8)

        # ========== HIGHLIGHT s ==========
        s_highlight = SurroundingRectangle(
            s_val, color=GREEN_3B1B, buff=0.08, corner_radius=0.05,
        )
        s_note = Text(
            "s = standard deviation of residuals (estimates \u03c3)",
            font_size=18, color=ManimColor(GREEN_3B1B),
        )
        s_note.next_to(s_val, DOWN, buff=0.3)
        self.play(Create(s_highlight), Write(s_note), run_time=0.5)
        self.wait(0.8)

        # ========== KEY INSIGHT BOX ==========
        everything = VGroup(
            title, subtitle, header_texts, header_line,
            const_texts, dur_texts, extra_line, s_val,
            b1_box, b1_label, b1_arrow, b1_desc,
            se_box, se_label, se_arrow, se_desc,
            s_highlight, s_note,
        )
        self.play(FadeOut(everything), run_time=0.5)

        box_items = VGroup(
            Text("Key Values in Regression Output", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text("b\u2081 (Coef for predictor) = sample slope", font_size=24, color=ManimColor(BLUE_3B1B)),
            Text("SE(b\u2081) (SE Coef) = standard error of slope", font_size=24, color=ManimColor(PINK_3B1B)),
            Text("s = standard deviation of residuals", font_size=24, color=ManimColor(GREEN_3B1B)),
            Text("", font_size=6),
            Text("SE(b\u2081) = s / (s\u2093 \u00d7 \u221a(n\u22121))", font_size=24, color=YELLOW_3B1B),
            Text("", font_size=6),
            Text("Always read from the predictor row,", font_size=22),
            Text("not the Constant row!", font_size=22, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.12)
        box_items.move_to(ORIGIN)

        box = SurroundingRectangle(box_items, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15)

        self.play(
            LaggedStart(*[Write(line) for line in box_items], lag_ratio=0.18),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(1.8)
