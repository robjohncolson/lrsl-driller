"""
State the Null Hypothesis (AP Stats Unit 6, Topic 6.4)

Introduces the null hypothesis concept: H0 is the "no difference" or "no change"
assumption. Shows H0: p = p0 notation with a normal curve centered at p0.
Emphasizes that the null ALWAYS contains "=" and uses the parameter p (not p-hat).

Run with: manim -qm --format=mp4 apstat_64_state_null.py StateNullHypothesis
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"


class StateNullHypothesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("The Null Hypothesis", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "The starting assumption in a significance test",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== BALANCE SCALE (equilibrium = no difference) ==========
        base_tri = Triangle(fill_opacity=0.8, fill_color=GREY_B, stroke_color=WHITE)
        base_tri.scale(0.35).move_to(ORIGIN + DOWN * 0.3)
        bar = Line(LEFT * 1.8, RIGHT * 1.8, stroke_width=4, color=WHITE)
        bar.move_to(base_tri.get_top() + UP * 0.05)

        label_left = Text("No\nEffect", font_size=18, color=GREY_B)
        label_left.next_to(bar.get_left(), UP, buff=0.15)
        label_right = Text("No\nDifference", font_size=18, color=GREY_B)
        label_right.next_to(bar.get_right(), UP, buff=0.15)

        balance = VGroup(base_tri, bar, label_left, label_right)
        balance.shift(UP * 0.5)

        eq_label = Text(
            "Equilibrium: nothing has changed",
            font_size=22, color=YELLOW_3B1B,
        )
        eq_label.next_to(balance, DOWN, buff=0.35)

        self.play(FadeIn(base_tri), Create(bar), run_time=0.6)
        self.play(Write(label_left), Write(label_right), run_time=0.5)
        self.play(Write(eq_label), run_time=0.5)
        self.wait(0.8)

        # ========== TRANSITION ==========
        self.play(
            FadeOut(VGroup(balance, eq_label, subtitle)),
            run_time=0.5,
        )

        # ========== H0 NOTATION ==========
        h0_label = Text("Notation:", font_size=26, color=GREY_B)
        h0_label.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5, LEFT)
        self.play(Write(h0_label), run_time=0.3)

        # Build H0 notation with Text (no LaTeX needed)
        h0_symbol = Text("H\u2080", font_size=48, color=BLUE_3B1B, weight=BOLD)
        h0_colon = Text(" : ", font_size=48, color=WHITE)
        h0_p = Text("p", font_size=48, color=YELLOW_3B1B, weight=BOLD)
        h0_eq_sign = Text(" = ", font_size=48, color=WHITE)
        h0_p0 = Text("p\u2080", font_size=48, color=YELLOW_3B1B, weight=BOLD)

        h0_row = VGroup(h0_symbol, h0_colon, h0_p, h0_eq_sign, h0_p0)
        h0_row.arrange(RIGHT, buff=0.05)
        h0_row.next_to(h0_label, DOWN, buff=0.25).align_to(LEFT * 4, LEFT)

        # Build piece by piece
        self.play(Write(h0_symbol), Write(h0_colon), run_time=0.4)
        self.wait(0.2)

        h0_note = Text(
            '"H-sub-zero" = null hypothesis',
            font_size=20, color=GREY_B,
        )
        h0_note.next_to(h0_row, RIGHT, buff=0.5)
        self.play(Write(h0_note), run_time=0.4)
        self.wait(0.3)

        self.play(Write(h0_p), Write(h0_eq_sign), Write(h0_p0), run_time=0.6)
        self.play(FadeOut(h0_note), run_time=0.3)

        # Parameter annotations
        p_note = Text(
            "p = the true population proportion",
            font_size=20, color=YELLOW_3B1B,
        )
        p_note.next_to(h0_row, DOWN, buff=0.25, aligned_edge=LEFT)
        self.play(Write(p_note), run_time=0.5)

        p0_note = Text(
            "p\u2080 = the hypothesized value (a specific number)",
            font_size=20, color=YELLOW_3B1B,
        )
        p0_note.next_to(p_note, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(p0_note), run_time=0.5)
        self.wait(0.5)

        # ========== NORMAL CURVE AT p0 ==========
        axes = Axes(
            x_range=[0, 1, 0.1],
            y_range=[0, 10, 2],
            x_length=8,
            y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 1.5)

        p0_val = 0.5
        sd = 0.06

        curve = axes.plot(
            lambda x: (1 / (sd * np.sqrt(2 * np.pi)))
            * np.exp(-0.5 * ((x - p0_val) / sd) ** 2),
            x_range=[0.2, 0.8],
            color=ManimColor(BLUE_3B1B),
        )

        p0_line = axes.get_vertical_line(
            axes.i2gp(p0_val, curve),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )

        p0_label_tex = Text("p\u2080", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        p0_label_tex.next_to(p0_line, DOWN, buff=0.15)

        center_note = Text(
            "Centered at the hypothesized value",
            font_size=18, color=GREY_B,
        )
        center_note.next_to(axes, DOWN, buff=0.15)

        self.play(Create(axes), run_time=0.5)
        self.play(Create(curve), run_time=0.6)
        self.play(Create(p0_line), Write(p0_label_tex), run_time=0.4)
        self.play(Write(center_note), run_time=0.4)
        self.wait(0.5)

        # ========== KEY RULE BOX ==========
        self.play(
            FadeOut(VGroup(p_note, p0_note, h0_label, center_note)),
            VGroup(axes, curve, p0_line, p0_label_tex).animate.scale(0.6).shift(
                DOWN * 0.5 + RIGHT * 2.5
            ),
            run_time=0.6,
        )

        key_text = Text("Key Rule:", font_size=26, color=WHITE, weight=BOLD)
        key_text.move_to(LEFT * 2.5 + DOWN * 0.5)

        rule_text = Text(
            'The null hypothesis\nALWAYS contains "="',
            font_size=24,
            color=GREEN_3B1B,
        )
        rule_text.next_to(key_text, DOWN, buff=0.2)

        rule_group = VGroup(key_text, rule_text)
        rule_box = SurroundingRectangle(
            rule_group, color=GREEN_3B1B, buff=0.25, corner_radius=0.1,
        )

        self.play(Write(key_text), run_time=0.4)
        self.play(Write(rule_text), run_time=0.5)
        self.play(Create(rule_box), run_time=0.4)
        self.wait(0.5)

        # ========== CLOSING ==========
        closing = Text(
            "Until we have convincing evidence,\nwe assume H\u2080 is true.",
            font_size=24,
            color=TEAL_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        self.play(Write(closing), run_time=0.6)
        self.wait(1.5)
