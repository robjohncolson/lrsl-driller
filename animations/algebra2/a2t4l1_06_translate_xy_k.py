"""
Level 6: Translating xy = k — Rewrite Then Shift

Shows how to convert xy = c into y = c/x, then apply horizontal and
vertical translations to obtain y = c/(x - h) + k.  The hyperbola
slides smoothly while asymptotes track the motion.

Run with: python -m manim -qm --format=mp4 a2t4l1_06_translate_xy_k.py TranslateXYScene
"""
from manim import *


class TranslateXYScene(Scene):
    def construct(self):
        # ── Constants ─────────────────────────────────────────────────
        C = 6                   # the constant product
        H_SHIFT = 3             # translate right
        K_SHIFT = 2             # translate up

        CURVE_COL = YELLOW
        FADED_COL = GREY_B
        H_ASYM_COL = BLUE       # horizontal asymptote
        V_ASYM_COL = RED         # vertical asymptote
        EQ_COL = GREEN
        ACCENT = TEAL

        # ============================================================
        # SCENE 1 — Algebraic rewrite: xy = 6  →  y = 6/x
        # ============================================================
        title = Text("Translating Inverse Variation", font_size=42)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)
        self.wait(0.5)

        # Show xy = 6
        eq_xy = MathTex(r"xy", r"=", r"6", font_size=52)
        eq_xy[0].set_color(CURVE_COL)
        eq_xy[2].set_color(EQ_COL)
        eq_xy.move_to(ORIGIN + UP * 0.8)
        self.play(Write(eq_xy), run_time=0.8)
        self.wait(0.6)

        # Narration: divide both sides by x
        divide_text = Text("Divide both sides by x", font_size=26, color=ACCENT)
        divide_text.next_to(eq_xy, DOWN, buff=0.5)
        self.play(FadeIn(divide_text, shift=UP * 0.15), run_time=0.5)
        self.wait(0.4)

        # Show the division step
        div_step = MathTex(
            r"\frac{xy}{x}", r"=", r"\frac{6}{x}",
            font_size=48
        )
        div_step[0].set_color(CURVE_COL)
        div_step[2].set_color(EQ_COL)
        div_step.next_to(divide_text, DOWN, buff=0.4)
        self.play(Write(div_step), run_time=0.7)
        self.wait(0.5)

        # Simplify to y = 6/x
        eq_yx = MathTex(r"y", r"=", r"\frac{6}{x}", font_size=52)
        eq_yx[0].set_color(CURVE_COL)
        eq_yx[2].set_color(EQ_COL)
        eq_yx.move_to(div_step.get_center())
        self.play(
            ReplacementTransform(div_step, eq_yx),
            run_time=0.7
        )
        self.wait(0.5)

        # Side-by-side with double arrow
        self.play(FadeOut(divide_text), run_time=0.3)

        eq_xy_copy = MathTex(r"xy = 6", font_size=44, color=CURVE_COL)
        eq_yx_copy = MathTex(r"y = \frac{6}{x}", font_size=44, color=EQ_COL)
        double_arrow = MathTex(r"\Longleftrightarrow", font_size=44, color=WHITE)
        equiv_group = VGroup(eq_xy_copy, double_arrow, eq_yx_copy).arrange(RIGHT, buff=0.5)
        equiv_group.move_to(ORIGIN)

        same_label = Text("These are the same function!", font_size=26, color=ACCENT)
        same_label.next_to(equiv_group, DOWN, buff=0.4)

        self.play(
            FadeOut(eq_xy), FadeOut(eq_yx),
            FadeIn(equiv_group),
            FadeIn(same_label, shift=UP * 0.15),
            run_time=0.8
        )
        self.wait(1.5)

        # ============================================================
        # SCENE 2 — Plot y = 6/x with asymptotes
        # ============================================================
        self.play(
            FadeOut(equiv_group), FadeOut(same_label), FadeOut(title),
            run_time=0.6
        )

        axes = Axes(
            x_range=[-7, 9, 1],
            y_range=[-5, 7, 1],
            x_length=10,
            y_length=8,
            axis_config={"include_numbers": True, "font_size": 20},
            tips=True,
        )
        axes.shift(DOWN * 0.3)
        axes_labels = axes.get_axis_labels(x_label="x", y_label="y")

        self.play(Create(axes), Write(axes_labels), run_time=1.0)
        self.wait(0.3)

        # Original asymptotes at x=0, y=0 (the axes themselves serve,
        # but we draw explicit dashed lines so we can move them later)
        v_asym_orig = DashedLine(
            start=axes.c2p(0, -5), end=axes.c2p(0, 7),
            color=V_ASYM_COL, stroke_width=2, dash_length=0.12
        )
        h_asym_orig = DashedLine(
            start=axes.c2p(-7, 0), end=axes.c2p(9, 0),
            color=H_ASYM_COL, stroke_width=2, dash_length=0.12
        )

        v_label_orig = MathTex(r"x=0", font_size=22, color=V_ASYM_COL)
        v_label_orig.next_to(v_asym_orig, LEFT, buff=0.15).shift(UP * 2.5)
        h_label_orig = MathTex(r"y=0", font_size=22, color=H_ASYM_COL)
        h_label_orig.next_to(h_asym_orig, UP, buff=0.1).shift(RIGHT * 3.5)

        self.play(
            Create(v_asym_orig), Create(h_asym_orig),
            Write(v_label_orig), Write(h_label_orig),
            run_time=0.7
        )
        self.wait(0.3)

        # Plot y = 6/x  (two branches, avoid x=0)
        EPSILON = 0.15

        graph_q1 = axes.plot(
            lambda x: C / x, x_range=[EPSILON, 8.5, 0.05],
            color=CURVE_COL, stroke_width=3
        )
        graph_q3 = axes.plot(
            lambda x: C / x, x_range=[-7, -EPSILON, 0.05],
            color=CURVE_COL, stroke_width=3
        )

        eq_label = MathTex(r"y = \frac{6}{x}", font_size=32, color=CURVE_COL)
        eq_label.next_to(axes.c2p(4, 1.5), RIGHT, buff=0.2)

        self.play(
            Create(graph_q1), Create(graph_q3),
            Write(eq_label),
            run_time=1.2
        )
        self.wait(1.0)

        # Mark the asymptote intersection (0,0)
        origin_dot = Dot(axes.c2p(0, 0), color=WHITE, radius=0.07)
        origin_label = MathTex(r"(0,\,0)", font_size=24, color=WHITE)
        origin_label.next_to(origin_dot, DL, buff=0.15)
        self.play(FadeIn(origin_dot), Write(origin_label), run_time=0.5)
        self.wait(0.8)

        # ============================================================
        # SCENE 3 — Smooth translation with ValueTrackers
        # ============================================================
        translate_title = Text(
            "Translate 3 right and 2 up", font_size=30, color=ACCENT
        )
        translate_title.to_edge(UP, buff=0.3)
        self.play(Write(translate_title), run_time=0.6)
        self.wait(0.5)

        # Fade original curve to grey (keep on screen for comparison)
        self.play(
            graph_q1.animate.set_color(FADED_COL).set_stroke(opacity=0.35),
            graph_q3.animate.set_color(FADED_COL).set_stroke(opacity=0.35),
            eq_label.animate.set_color(FADED_COL).set_opacity(0.4),
            v_asym_orig.animate.set_opacity(0.3),
            h_asym_orig.animate.set_opacity(0.3),
            v_label_orig.animate.set_opacity(0.3),
            h_label_orig.animate.set_opacity(0.3),
            origin_label.animate.set_opacity(0.3),
            origin_dot.animate.set_opacity(0.3),
            run_time=0.6
        )

        # ValueTrackers for smooth animation
        h_track = ValueTracker(0)   # horizontal shift (will go to H_SHIFT)
        k_track = ValueTracker(0)   # vertical shift   (will go to K_SHIFT)

        # Translated curve (always_redraw — redraws each frame)
        trans_q1 = always_redraw(lambda: axes.plot(
            lambda x: C / (x - h_track.get_value()) + k_track.get_value(),
            x_range=[h_track.get_value() + EPSILON, 8.5, 0.05],
            color=CURVE_COL, stroke_width=3
        ))
        trans_q3 = always_redraw(lambda: axes.plot(
            lambda x: C / (x - h_track.get_value()) + k_track.get_value(),
            x_range=[-7, h_track.get_value() - EPSILON, 0.05],
            color=CURVE_COL, stroke_width=3
        ))

        # Translated asymptotes (always_redraw)
        trans_v_asym = always_redraw(lambda: DashedLine(
            start=axes.c2p(h_track.get_value(), -5),
            end=axes.c2p(h_track.get_value(), 7),
            color=V_ASYM_COL, stroke_width=2.5, dash_length=0.12
        ))
        trans_h_asym = always_redraw(lambda: DashedLine(
            start=axes.c2p(-7, k_track.get_value()),
            end=axes.c2p(9, k_track.get_value()),
            color=H_ASYM_COL, stroke_width=2.5, dash_length=0.12
        ))

        # Asymptote labels (always_redraw)
        trans_v_label = always_redraw(lambda: MathTex(
            f"x={h_track.get_value():.0f}",
            font_size=22, color=V_ASYM_COL
        ).next_to(
            axes.c2p(h_track.get_value(), 5.5), RIGHT, buff=0.15
        ))
        trans_h_label = always_redraw(lambda: MathTex(
            f"y={k_track.get_value():.0f}",
            font_size=22, color=H_ASYM_COL
        ).next_to(
            axes.c2p(7, k_track.get_value()), UP, buff=0.1
        ))

        self.add(trans_q1, trans_q3, trans_v_asym, trans_h_asym,
                 trans_v_label, trans_h_label)

        # ── Step-by-step equation build (right side) ─────────────────
        step_start = MathTex(
            r"\text{Start: } y = \frac{6}{x}",
            font_size=28, color=EQ_COL
        )
        step_start.to_corner(UR, buff=0.5).shift(DOWN * 1.0)
        self.play(Write(step_start), run_time=0.5)
        self.wait(0.4)

        # Animate horizontal shift: right 3
        step_right = MathTex(
            r"\text{Right 3: } y = \frac{6}{x - 3}",
            font_size=28, color=EQ_COL
        )
        step_right.next_to(step_start, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(
            h_track.animate.set_value(H_SHIFT),
            run_time=2.0,
            rate_func=smooth
        )
        self.play(Write(step_right), run_time=0.5)
        self.wait(0.6)

        # Animate vertical shift: up 2
        step_up = MathTex(
            r"\text{Up 2: } y = \frac{6}{x - 3} + 2",
            font_size=28, color=EQ_COL
        )
        step_up.next_to(step_right, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(
            k_track.animate.set_value(K_SHIFT),
            run_time=2.0,
            rate_func=smooth
        )
        self.play(Write(step_up), run_time=0.5)
        self.wait(0.8)

        # Mark the new asymptote intersection (3, 2)
        new_center = Dot(axes.c2p(H_SHIFT, K_SHIFT), color=WHITE, radius=0.07)
        new_center_label = MathTex(r"(3,\,2)", font_size=24, color=WHITE)
        new_center_label.next_to(new_center, DL, buff=0.15)
        self.play(FadeIn(new_center), Write(new_center_label), run_time=0.5)
        self.wait(0.8)

        # ============================================================
        # SCENE 4 — Final comparison and boxed summary
        # ============================================================
        # Briefly highlight the comparison: original (0,0) vs translated (3,2)
        arrow_shift = Arrow(
            start=axes.c2p(0.3, 0.3),
            end=axes.c2p(H_SHIFT - 0.3, K_SHIFT - 0.3),
            color=ACCENT, stroke_width=2.5, buff=0.05
        )
        shift_label = MathTex(r"(0,0) \to (3,2)", font_size=24, color=ACCENT)
        shift_label.next_to(arrow_shift, UP, buff=0.1)
        self.play(Create(arrow_shift), Write(shift_label), run_time=0.7)
        self.wait(1.0)

        # Clear to boxed summary
        self.play(
            *[FadeOut(mob) for mob in [
                axes, axes_labels,
                graph_q1, graph_q3,
                trans_q1, trans_q3,
                trans_v_asym, trans_h_asym,
                trans_v_label, trans_h_label,
                v_asym_orig, h_asym_orig,
                v_label_orig, h_label_orig,
                origin_dot, origin_label,
                new_center, new_center_label,
                eq_label, translate_title,
                step_start, step_right, step_up,
                arrow_shift, shift_label,
            ]],
            run_time=0.8
        )

        # Boxed key takeaway
        summary_lines = VGroup(
            Text("Translating Inverse Variation", font_size=30, color=EQ_COL),
            MathTex(
                r"xy = c",
                r"\;\longrightarrow\;",
                r"y = \frac{c}{x}",
                r"\;\longrightarrow\;",
                r"y = \frac{c}{x - h} + k",
                font_size=34
            ),
            VGroup(
                Text("Rewrite first,", font_size=22, color=ACCENT),
                Text(" then translate.", font_size=22, color=ACCENT),
            ).arrange(RIGHT, buff=0.08),
        ).arrange(DOWN, buff=0.35)

        # Color the equation parts
        summary_eq = summary_lines[1]
        summary_eq[0].set_color(CURVE_COL)       # xy = c
        summary_eq[2].set_color(CURVE_COL)       # y = c/x
        summary_eq[4].set_color(EQ_COL)          # y = c/(x-h) + k

        summary_lines.move_to(ORIGIN)

        summary_box = SurroundingRectangle(
            summary_lines, color=EQ_COL, buff=0.35, corner_radius=0.12
        )
        self.play(Write(summary_lines), Create(summary_box), run_time=1.2)
        self.wait(2.5)
