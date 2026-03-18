"""
Level 4 – Horizontal Asymptote of y = a/(x-h) + k
Shows why y = k is the horizontal asymptote by tracing the curve as x grows,
then demonstrating a vertical shift, the general form colour-coded, and a
common-mistake spotlight.

Run with:
    manim -qm --format=mp4 a2t4l1_04_horizontal_asymptote.py HorizontalAsymptoteScene
"""
from manim import *


class HorizontalAsymptoteScene(Scene):
    def construct(self):
        # ── Scene 1: y = 1/x  and tracing x → ∞ ─────────────────────────
        s1_title = Text("Parent Function: y = 1/x", font_size=40, weight=BOLD)
        s1_title.to_edge(UP)
        self.play(Write(s1_title))
        self.wait(0.3)

        axes1 = Axes(
            x_range=[-8, 20, 2],
            y_range=[-3, 5, 1],
            x_length=9,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 22},
            tips=True,
        )
        axes1.shift(DOWN * 0.4)
        axes1_labels = axes1.get_axis_labels(x_label="x", y_label="y")

        # Plot y = 1/x (two branches, avoid x = 0)
        curve_pos = axes1.plot(
            lambda x: 1 / x, x_range=[0.15, 19, 0.05], color=YELLOW
        )
        curve_neg = axes1.plot(
            lambda x: 1 / x, x_range=[-8, -0.15, 0.05], color=YELLOW
        )

        self.play(Create(axes1), Write(axes1_labels), run_time=1)
        self.play(Create(curve_pos), Create(curve_neg), run_time=1.2)
        self.wait(0.3)

        # Horizontal asymptote y = 0 (dashed)
        ha_line_0 = DashedLine(
            start=axes1.c2p(-8, 0),
            end=axes1.c2p(20, 0),
            color=BLUE,
            dash_length=0.12,
            stroke_width=3,
        )
        ha_label_0 = MathTex("y = 0", font_size=30, color=BLUE)
        ha_label_0.next_to(ha_line_0.get_end(), UP, buff=0.15)
        self.play(Create(ha_line_0), Write(ha_label_0), run_time=0.8)
        self.wait(0.3)

        # ValueTracker: dot traces curve x from 1 → 18
        t = ValueTracker(1)
        dot = always_redraw(
            lambda: Dot(
                axes1.c2p(t.get_value(), 1 / t.get_value()),
                color=WHITE,
                radius=0.08,
            )
        )
        y_label = always_redraw(
            lambda: MathTex(
                f"y = {1 / t.get_value():.3f}",
                font_size=28,
                color=WHITE,
            ).next_to(
                axes1.c2p(t.get_value(), 1 / t.get_value()),
                UR,
                buff=0.15,
            )
        )

        self.play(FadeIn(dot), FadeIn(y_label))
        self.play(t.animate.set_value(18), run_time=4, rate_func=smooth)
        self.wait(0.3)

        approach_text = Text(
            "As x \u2192 \u221e, y \u2192 0", font_size=30, color=BLUE
        )
        approach_text.to_edge(DOWN, buff=0.35)
        self.play(Write(approach_text), run_time=0.8)
        self.wait(1)

        # Fade Scene 1
        s1_group = VGroup(
            s1_title, axes1, axes1_labels, curve_pos, curve_neg,
            ha_line_0, ha_label_0, dot, y_label, approach_text,
        )
        self.play(FadeOut(s1_group), run_time=0.6)

        # ── Scene 2: y = 1/x + 3  (vertical shift) ──────────────────────
        s2_title = Text("Shift Up: y = 1/x + 3", font_size=40, weight=BOLD)
        s2_title.to_edge(UP)
        self.play(Write(s2_title))
        self.wait(0.3)

        axes2 = Axes(
            x_range=[-8, 20, 2],
            y_range=[-2, 8, 1],
            x_length=9,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 22},
            tips=True,
        )
        axes2.shift(DOWN * 0.4)
        axes2_labels = axes2.get_axis_labels(x_label="x", y_label="y")

        # Ghost of y = 1/x (dimmed)
        ghost_pos = axes2.plot(
            lambda x: 1 / x, x_range=[0.15, 19, 0.05],
            color=YELLOW, stroke_opacity=0.25,
        )
        ghost_neg = axes2.plot(
            lambda x: 1 / x, x_range=[-8, -0.15, 0.05],
            color=YELLOW, stroke_opacity=0.25,
        )

        # y = 1/x + 3
        curve2_pos = axes2.plot(
            lambda x: 1 / x + 3, x_range=[0.15, 19, 0.05], color=YELLOW
        )
        curve2_neg = axes2.plot(
            lambda x: 1 / x + 3, x_range=[-8, -0.15, 0.05], color=YELLOW
        )

        self.play(Create(axes2), Write(axes2_labels), run_time=0.8)
        self.play(Create(ghost_pos), Create(ghost_neg), run_time=0.6)

        # Animate the shift: show old dashed at y=0, then move to y=3
        old_ha = DashedLine(
            start=axes2.c2p(-8, 0), end=axes2.c2p(20, 0),
            color=BLUE, dash_length=0.12, stroke_width=3, stroke_opacity=0.4,
        )
        new_ha = DashedLine(
            start=axes2.c2p(-8, 3), end=axes2.c2p(20, 3),
            color=BLUE, dash_length=0.12, stroke_width=3,
        )
        ha_label_3 = MathTex("y = 3", font_size=32, color=BLUE)
        ha_label_3.next_to(new_ha.get_end(), UP, buff=0.15)

        self.play(Create(old_ha), run_time=0.4)
        self.play(
            Create(curve2_pos), Create(curve2_neg),
            ReplacementTransform(old_ha, new_ha),
            run_time=1.2,
        )
        self.play(Write(ha_label_3), run_time=0.5)
        self.wait(0.3)

        # Trace dot along y = 1/x + 3
        t2 = ValueTracker(1)
        dot2 = always_redraw(
            lambda: Dot(
                axes2.c2p(t2.get_value(), 1 / t2.get_value() + 3),
                color=WHITE, radius=0.08,
            )
        )
        y_label2 = always_redraw(
            lambda: MathTex(
                f"y = {1 / t2.get_value() + 3:.3f}",
                font_size=28, color=WHITE,
            ).next_to(
                axes2.c2p(t2.get_value(), 1 / t2.get_value() + 3),
                UR, buff=0.15,
            )
        )

        self.play(FadeIn(dot2), FadeIn(y_label2))
        self.play(t2.animate.set_value(18), run_time=3.5, rate_func=smooth)
        self.wait(0.3)

        shift_insight = Text(
            'The +3 shifts the "landing level" to y = 3',
            font_size=28, color=BLUE,
        )
        shift_insight.to_edge(DOWN, buff=0.35)
        self.play(Write(shift_insight), run_time=1)
        self.wait(1.2)

        s2_group = VGroup(
            s2_title, axes2, axes2_labels, ghost_pos, ghost_neg,
            curve2_pos, curve2_neg, new_ha, ha_label_3,
            dot2, y_label2, shift_insight,
        )
        self.play(FadeOut(s2_group), run_time=0.6)

        # ── Scene 3: General form — colour-coded ────────────────────────
        s3_title = Text("General Form", font_size=40, weight=BOLD)
        s3_title.to_edge(UP)
        self.play(Write(s3_title))
        self.wait(0.3)

        # y = a/(x - h) + k  with h in RED, k in BLUE
        general = MathTex(
            r"y", r"=", r"\frac{a}{x - ", r"h", r"}", r"+", r"k",
            font_size=56,
        )
        general[3].set_color(RED)      # h
        general[6].set_color(BLUE)     # k
        general.move_to(UP * 1.5)
        self.play(Write(general), run_time=1.2)
        self.wait(0.5)

        # Coordinate axes for illustration
        axes3 = Axes(
            x_range=[-4, 12, 2],
            y_range=[-3, 8, 1],
            x_length=7,
            y_length=4.5,
            axis_config={"include_numbers": True, "font_size": 20},
            tips=True,
        )
        axes3.shift(DOWN * 1)
        axes3_labels = axes3.get_axis_labels(x_label="x", y_label="y")

        # Plot y = 2/(x-3) + 4  (h=3, k=4)
        demo_pos = axes3.plot(
            lambda x: 2 / (x - 3) + 4, x_range=[3.15, 11, 0.05], color=YELLOW,
        )
        demo_neg = axes3.plot(
            lambda x: 2 / (x - 3) + 4, x_range=[-4, 2.85, 0.05], color=YELLOW,
        )

        self.play(Create(axes3), Write(axes3_labels), run_time=0.8)
        self.play(Create(demo_pos), Create(demo_neg), run_time=0.8)

        # Vertical asymptote x = 3 (RED)
        va_line = DashedLine(
            start=axes3.c2p(3, -3), end=axes3.c2p(3, 8),
            color=RED, dash_length=0.12, stroke_width=3,
        )
        va_label = MathTex("x = h", font_size=28, color=RED)
        va_label.next_to(va_line, LEFT, buff=0.15).shift(UP * 1.2)

        # Horizontal asymptote y = 4 (BLUE)
        ha_line = DashedLine(
            start=axes3.c2p(-4, 4), end=axes3.c2p(12, 4),
            color=BLUE, dash_length=0.12, stroke_width=3,
        )
        ha_label = MathTex("y = k", font_size=28, color=BLUE)
        ha_label.next_to(ha_line.get_end(), UP, buff=0.15)

        self.play(
            Create(va_line), Write(va_label),
            Create(ha_line), Write(ha_label),
            run_time=1,
        )
        self.wait(0.4)

        # Arrows from equation parts to asymptote labels
        h_arrow = Arrow(
            general[3].get_bottom(), va_label.get_top(),
            color=RED, buff=0.15, stroke_width=3, max_tip_length_to_length_ratio=0.15,
        )
        k_arrow = Arrow(
            general[6].get_bottom(), ha_label.get_left(),
            color=BLUE, buff=0.15, stroke_width=3, max_tip_length_to_length_ratio=0.15,
        )
        self.play(GrowArrow(h_arrow), GrowArrow(k_arrow), run_time=1)

        h_note = Text("Vertical asymptote", font_size=22, color=RED)
        h_note.next_to(h_arrow, RIGHT, buff=0.1).shift(DOWN * 0.2)
        k_note = Text("Horizontal asymptote", font_size=22, color=BLUE)
        k_note.next_to(k_arrow, LEFT, buff=0.1).shift(DOWN * 0.2)
        self.play(Write(h_note), Write(k_note), run_time=0.8)
        self.wait(1.5)

        s3_group = VGroup(
            s3_title, general, axes3, axes3_labels,
            demo_pos, demo_neg, va_line, va_label,
            ha_line, ha_label, h_arrow, k_arrow,
            h_note, k_note,
        )
        self.play(FadeOut(s3_group), run_time=0.6)

        # ── Scene 4: Common-mistake spotlight ────────────────────────────
        s4_title = Text("Common Mistake Spotlight", font_size=40, weight=BOLD)
        s4_title.to_edge(UP)
        self.play(Write(s4_title))
        self.wait(0.3)

        # Show equation
        eq = MathTex(
            r"y = \frac{2}{x + 5} - 4",
            font_size=52,
        )
        eq.shift(UP * 1.8)
        self.play(Write(eq), run_time=1)
        self.wait(0.5)

        prompt = Text(
            "What is the horizontal asymptote?",
            font_size=30, color=YELLOW,
        )
        prompt.next_to(eq, DOWN, buff=0.5)
        self.play(Write(prompt), run_time=0.8)
        self.wait(0.8)

        # Wrong answer — crossed out
        wrong = MathTex(r"x = -5", font_size=44, color=RED)
        wrong.shift(DOWN * 0.4 + LEFT * 2.5)
        wrong_label = Text("VERTICAL asymptote", font_size=22, color=RED)
        wrong_label.next_to(wrong, DOWN, buff=0.2)
        self.play(Write(wrong), Write(wrong_label), run_time=0.8)
        self.wait(0.4)

        cross = Cross(wrong, stroke_color=RED, stroke_width=6)
        self.play(Create(cross), run_time=0.6)
        self.wait(0.5)

        # Correct answer — boxed in green
        correct = MathTex(r"y = -4", font_size=44, color=GREEN)
        correct.shift(DOWN * 0.4 + RIGHT * 2.5)
        correct_label = Text("HORIZONTAL asymptote", font_size=22, color=GREEN)
        correct_label.next_to(correct, DOWN, buff=0.2)
        self.play(Write(correct), Write(correct_label), run_time=0.8)

        correct_box = SurroundingRectangle(
            correct, color=GREEN, buff=0.15, stroke_width=3,
        )
        check = MathTex(r"\checkmark", font_size=40, color=GREEN)
        check.next_to(correct_box, RIGHT, buff=0.2)
        self.play(Create(correct_box), Write(check), run_time=0.6)
        self.wait(0.5)

        # Reasoning note
        reason = MathTex(
            r"y = \frac{a}{x - h} + k",
            r"\;\Rightarrow\;",
            r"k = -4",
            font_size=34,
        )
        reason[2].set_color(GREEN)
        reason.shift(DOWN * 2)
        self.play(Write(reason), run_time=0.8)
        self.wait(1.2)

        # Fade Scene 4
        s4_group = VGroup(
            s4_title, eq, prompt,
            wrong, wrong_label, cross,
            correct, correct_label, correct_box, check,
            reason,
        )
        self.play(FadeOut(s4_group), run_time=0.6)

        # ── Final takeaway ───────────────────────────────────────────────
        takeaway_eq = MathTex(
            r"y = \frac{a}{x - h} + k",
            font_size=48,
        )
        takeaway_eq.shift(UP * 0.6)

        takeaway_arrow = MathTex(r"\Longrightarrow", font_size=48)
        takeaway_arrow.next_to(takeaway_eq, DOWN, buff=0.35)

        takeaway_rule = MathTex(
            r"\text{Horizontal asymptote: } y = k",
            font_size=44, color=BLUE,
        )
        takeaway_rule.next_to(takeaway_arrow, DOWN, buff=0.35)

        box = SurroundingRectangle(
            VGroup(takeaway_eq, takeaway_arrow, takeaway_rule),
            color=BLUE, buff=0.35, corner_radius=0.15, stroke_width=3,
        )

        self.play(Write(takeaway_eq), run_time=0.8)
        self.play(Write(takeaway_arrow), run_time=0.4)
        self.play(Write(takeaway_rule), run_time=0.8)
        self.play(Create(box), run_time=0.6)
        self.wait(2)
