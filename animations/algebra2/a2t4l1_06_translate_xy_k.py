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
        self.scene1_algebraic_rewrite()
        self.scene2_plot_original()
        self.scene3_smooth_translation()
        self.scene4_boxed_summary()

    # ================================================================
    # SCENE 1 — Algebraic rewrite: xy = 6  →  y = 6/x   (~8 s)
    # ================================================================
    def scene1_algebraic_rewrite(self):
        C = 6  # noqa: N806 — constant

        # Show xy = 6 centered and large
        eq_xy = MathTex(r"xy", r"=", r"6", font_size=60)
        eq_xy[0].set_color(YELLOW)
        eq_xy[2].set_color(GREEN)
        eq_xy.move_to(ORIGIN + UP * 0.8)
        self.play(Write(eq_xy), run_time=0.8)
        self.wait(0.5)

        # Step: divide both sides by x
        divide_text = Text("Divide both sides by x", font_size=28, color=WHITE)
        divide_text.next_to(eq_xy, DOWN, buff=0.5)
        self.play(FadeIn(divide_text, shift=UP * 0.15), run_time=0.5)
        self.wait(0.4)

        # Show the division step
        div_step = MathTex(
            r"\frac{xy}{x}", r"=", r"\frac{6}{x}",
            font_size=52,
        )
        div_step[0].set_color(YELLOW)
        div_step[2].set_color(GREEN)
        div_step.next_to(divide_text, DOWN, buff=0.4)
        self.play(Write(div_step), run_time=0.7)
        self.wait(0.5)

        # Simplify to y = 6/x in GREEN
        eq_yx = MathTex(r"y", r"=", r"\frac{6}{x}", font_size=52)
        eq_yx.set_color(GREEN)
        eq_yx.move_to(div_step.get_center())
        self.play(ReplacementTransform(div_step, eq_yx), run_time=0.7)
        self.wait(0.5)

        # Side-by-side with double arrow
        self.play(FadeOut(divide_text), run_time=0.3)

        eq_xy_side = MathTex(r"xy = 6", font_size=44, color=YELLOW)
        arrow_between = MathTex(r"\Longleftrightarrow", font_size=44, color=WHITE)
        eq_yx_side = MathTex(r"y = \frac{6}{x}", font_size=44, color=GREEN)
        equiv_group = VGroup(eq_xy_side, arrow_between, eq_yx_side).arrange(
            RIGHT, buff=0.5
        )
        equiv_group.move_to(ORIGIN)

        same_label = Text("These are the same function!", font_size=26, color=WHITE)
        same_label.next_to(equiv_group, DOWN, buff=0.4)

        self.play(
            FadeOut(eq_xy), FadeOut(eq_yx),
            FadeIn(equiv_group),
            FadeIn(same_label, shift=UP * 0.15),
            run_time=0.8,
        )
        self.wait(1.5)

        # Store for cleanup
        self._scene1_group = VGroup(equiv_group, same_label)

    # ================================================================
    # SCENE 2 — Plot y = 6/x with asymptotes   (~8 s)
    # ================================================================
    def scene2_plot_original(self):
        C = 6  # noqa: N806
        EPSILON = 0.15

        self.play(FadeOut(self._scene1_group), run_time=0.6)

        # Axes
        axes = Axes(
            x_range=[-6, 10, 2],
            y_range=[-4, 8, 1],
            x_length=8,
            y_length=6,
            axis_config={"include_numbers": True, "font_size": 20},
            tips=True,
        )
        axes.shift(DOWN * 0.3)
        axes_labels = axes.get_axis_labels(x_label="x", y_label="y")

        self.play(Create(axes), Write(axes_labels), run_time=1.0)
        self.wait(0.3)

        # Original asymptotes (explicit dashed lines so we can move them later)
        v_asym_orig = DashedLine(
            start=axes.c2p(0, -4), end=axes.c2p(0, 8),
            color=RED, stroke_width=2, dash_length=0.12,
        )
        h_asym_orig = DashedLine(
            start=axes.c2p(-6, 0), end=axes.c2p(10, 0),
            color=BLUE, stroke_width=2, dash_length=0.12,
        )
        v_label_orig = MathTex(r"x=0", font_size=22, color=RED)
        v_label_orig.next_to(v_asym_orig, LEFT, buff=0.15).shift(UP * 2.5)
        h_label_orig = MathTex(r"y=0", font_size=22, color=BLUE)
        h_label_orig.next_to(h_asym_orig, UP, buff=0.1).shift(RIGHT * 3.5)

        self.play(
            Create(v_asym_orig), Create(h_asym_orig),
            Write(v_label_orig), Write(h_label_orig),
            run_time=0.7,
        )
        self.wait(0.3)

        # Plot y = 6/x  (two branches, avoid x = 0)
        graph_pos = axes.plot(
            lambda x: C / x, x_range=[EPSILON, 9.5, 0.05],
            color=YELLOW, stroke_width=3,
        )
        graph_neg = axes.plot(
            lambda x: C / x, x_range=[-6, -EPSILON, 0.05],
            color=YELLOW, stroke_width=3,
        )

        eq_label = MathTex(r"y = \frac{6}{x}", font_size=32, color=GREEN)
        eq_label.next_to(axes.c2p(5, 1.5), RIGHT, buff=0.2)

        self.play(
            Create(graph_pos), Create(graph_neg),
            Write(eq_label),
            run_time=1.2,
        )
        self.wait(0.5)

        # Mark asymptote intersection (0, 0)
        origin_dot = Dot(axes.c2p(0, 0), color=WHITE, radius=0.07)
        origin_label = Text("(0, 0)", font_size=22, color=WHITE)
        origin_label.next_to(origin_dot, DL, buff=0.15)
        self.play(FadeIn(origin_dot), Write(origin_label), run_time=0.5)
        self.wait(0.8)

        # Store references for Scene 3
        self._axes = axes
        self._axes_labels = axes_labels
        self._graph_pos = graph_pos
        self._graph_neg = graph_neg
        self._eq_label = eq_label
        self._v_asym_orig = v_asym_orig
        self._h_asym_orig = h_asym_orig
        self._v_label_orig = v_label_orig
        self._h_label_orig = h_label_orig
        self._origin_dot = origin_dot
        self._origin_label = origin_label

    # ================================================================
    # SCENE 3 — Smooth translation with ValueTrackers   (~12 s)
    # ================================================================
    def scene3_smooth_translation(self):
        C = 6  # noqa: N806
        H_SHIFT = 3
        K_SHIFT = 2
        EPSILON = 0.15

        axes = self._axes

        translate_title = Text(
            "Translate 3 right and 2 up", font_size=30, color=WHITE,
        )
        translate_title.to_edge(UP, buff=0.3)
        self.play(Write(translate_title), run_time=0.6)
        self.wait(0.4)

        # Dim original curve to GREY (keep on screen for comparison)
        self.play(
            self._graph_pos.animate.set_color(GREY).set_stroke(opacity=0.25),
            self._graph_neg.animate.set_color(GREY).set_stroke(opacity=0.25),
            self._eq_label.animate.set_color(GREY).set_opacity(0.3),
            self._v_asym_orig.animate.set_opacity(0.25),
            self._h_asym_orig.animate.set_opacity(0.25),
            self._v_label_orig.animate.set_opacity(0.25),
            self._h_label_orig.animate.set_opacity(0.25),
            self._origin_label.animate.set_opacity(0.25),
            self._origin_dot.animate.set_opacity(0.25),
            run_time=0.6,
        )

        # ValueTrackers for smooth animation
        h_track = ValueTracker(0)
        k_track = ValueTracker(0)

        # Translated curve (always_redraw — redraws each frame)
        trans_pos = always_redraw(lambda: axes.plot(
            lambda x: C / (x - h_track.get_value()) + k_track.get_value(),
            x_range=[h_track.get_value() + EPSILON, 9.5, 0.05],
            color=YELLOW, stroke_width=3,
        ))
        trans_neg = always_redraw(lambda: axes.plot(
            lambda x: C / (x - h_track.get_value()) + k_track.get_value(),
            x_range=[-6, h_track.get_value() - EPSILON, 0.05],
            color=YELLOW, stroke_width=3,
        ))

        # Translated asymptotes (always_redraw)
        trans_v_asym = always_redraw(lambda: DashedLine(
            start=axes.c2p(h_track.get_value(), -4),
            end=axes.c2p(h_track.get_value(), 8),
            color=RED, stroke_width=2.5, dash_length=0.12,
        ))
        trans_h_asym = always_redraw(lambda: DashedLine(
            start=axes.c2p(-6, k_track.get_value()),
            end=axes.c2p(10, k_track.get_value()),
            color=BLUE, stroke_width=2.5, dash_length=0.12,
        ))

        # Asymptote labels (always_redraw)
        trans_v_label = always_redraw(lambda: MathTex(
            f"x={h_track.get_value():.0f}",
            font_size=22, color=RED,
        ).next_to(
            axes.c2p(h_track.get_value(), 6), RIGHT, buff=0.15,
        ))
        trans_h_label = always_redraw(lambda: MathTex(
            f"y={k_track.get_value():.0f}",
            font_size=22, color=BLUE,
        ).next_to(
            axes.c2p(8, k_track.get_value()), UP, buff=0.1,
        ))

        self.add(
            trans_pos, trans_neg,
            trans_v_asym, trans_h_asym,
            trans_v_label, trans_h_label,
        )

        # ── Step-by-step equation build (corner) ───────────────────
        eq_start = MathTex(
            r"y = \frac{6}{x}", font_size=32, color=GREEN,
        )
        eq_start.to_corner(UR, buff=0.5).shift(DOWN * 0.8)
        self.play(Write(eq_start), run_time=0.5)
        self.wait(0.3)

        # Animate horizontal shift: h = 0 → 3
        eq_after_h = MathTex(
            r"y = \frac{6}{x - 3}", font_size=32, color=GREEN,
        )
        eq_after_h.move_to(eq_start, aligned_edge=LEFT)

        self.play(
            h_track.animate.set_value(H_SHIFT),
            run_time=2.0, rate_func=smooth,
        )
        self.play(
            ReplacementTransform(eq_start, eq_after_h),
            run_time=0.6,
        )
        self.wait(0.5)

        # Animate vertical shift: k = 0 → 2
        eq_after_k = MathTex(
            r"y = \frac{6}{x - 3} + 2", font_size=32, color=GREEN,
        )
        eq_after_k.move_to(eq_after_h, aligned_edge=LEFT)

        self.play(
            k_track.animate.set_value(K_SHIFT),
            run_time=2.0, rate_func=smooth,
        )
        self.play(
            ReplacementTransform(eq_after_h, eq_after_k),
            run_time=0.6,
        )
        self.wait(0.5)

        # Mark the new asymptote intersection (3, 2) in GOLD
        new_center = Dot(axes.c2p(H_SHIFT, K_SHIFT), color=GOLD, radius=0.08)
        new_center_label = MathTex(r"(3,\,2)", font_size=24, color=GOLD)
        new_center_label.next_to(new_center, DL, buff=0.15)
        self.play(FadeIn(new_center, scale=1.3), Write(new_center_label), run_time=0.5)
        self.wait(0.4)

        # Arrow from ghost origin (0,0) to new center (3,2)
        shift_arrow = Arrow(
            start=axes.c2p(0.3, 0.3),
            end=axes.c2p(H_SHIFT - 0.3, K_SHIFT - 0.3),
            color=GOLD, stroke_width=2.5, buff=0.05,
        )
        shift_label = MathTex(
            r"(0,0) \to (3,2)", font_size=22, color=GOLD,
        )
        shift_label.next_to(shift_arrow, UP, buff=0.1)
        self.play(Create(shift_arrow), Write(shift_label), run_time=0.7)
        self.wait(1.0)

        # Store for cleanup
        self._scene3_group = VGroup(
            self._axes, self._axes_labels,
            self._graph_pos, self._graph_neg,
            trans_pos, trans_neg,
            trans_v_asym, trans_h_asym,
            trans_v_label, trans_h_label,
            self._v_asym_orig, self._h_asym_orig,
            self._v_label_orig, self._h_label_orig,
            self._origin_dot, self._origin_label,
            self._eq_label,
            new_center, new_center_label,
            eq_after_k, translate_title,
            shift_arrow, shift_label,
        )

    # ================================================================
    # SCENE 4 — Boxed summary   (~6 s)
    # ================================================================
    def scene4_boxed_summary(self):
        self.play(
            *[FadeOut(mob) for mob in self._scene3_group],
            run_time=0.8,
        )

        # Line 1: title
        summary_title = Text(
            "Translating Inverse Variation", font_size=30, color=GREEN,
        )

        # Line 2: rewrite chain
        summary_eq = MathTex(
            r"xy = c",
            r"\;\longrightarrow\;",
            r"y = \frac{c}{x}",
            r"\;\longrightarrow\;",
            r"y = \frac{c}{x - h} + k",
            font_size=34,
        )
        summary_eq[0].set_color(YELLOW)       # xy = c
        summary_eq[2].set_color(YELLOW)       # y = c/x
        summary_eq[4].set_color(GREEN)        # y = c/(x-h) + k

        # Line 3: takeaway
        summary_note = Text(
            "Rewrite first, then translate.", font_size=24, color=GREEN,
        )

        summary_group = VGroup(
            summary_title, summary_eq, summary_note,
        ).arrange(DOWN, buff=0.35)
        summary_group.move_to(ORIGIN)

        summary_box = SurroundingRectangle(
            summary_group, color=GOLD, buff=0.35, corner_radius=0.12,
        )

        self.play(Write(summary_group), Create(summary_box), run_time=1.2)
        self.wait(2.5)
