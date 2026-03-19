"""
Level 5: Translate the Parent Function y = 1/x

Shows how horizontal and vertical translations transform the reciprocal
function, with special emphasis on the "opposite sign" trap inside the
denominator.  3Blue1Brown style with smooth ValueTracker animations.

Run with: manim -qm --format=mp4 a2t4l1_05_translate_parent.py TranslateParentScene
"""
from manim import *


class TranslateParentScene(Scene):
    def construct(self):
        self.scene_parent_function()
        self.scene_vertical_shift()
        self.scene_horizontal_shift()
        self.scene_summary_pattern()

    # ================================================================
    # SCENE 1 — Parent function y = 1/x with asymptotes  (~8s)
    # ================================================================
    def scene_parent_function(self):
        # Axes per spec: x in [-6, 10] step 2, y in [-4, 8] step 1
        self.axes = Axes(
            x_range=[-6, 10, 2],
            y_range=[-4, 8, 1],
            x_length=8,
            y_length=6,
            axis_config={
                "include_tip": True,
                "tip_width": 0.15,
                "tip_height": 0.15,
            },
        ).shift(DOWN * 0.3)

        x_label = self.axes.get_x_axis_label("x", direction=RIGHT)
        y_label = self.axes.get_y_axis_label("y", direction=UP)

        self.play(Create(self.axes), Write(x_label), Write(y_label), run_time=1)

        # Parent curve y = 1/x — two branches to skip the asymptote
        pos_branch = self.axes.plot(
            lambda x: 1 / x, x_range=[0.12, 9], color=YELLOW, stroke_width=3,
        )
        neg_branch = self.axes.plot(
            lambda x: 1 / x, x_range=[-6, -0.12], color=YELLOW, stroke_width=3,
        )
        self.parent_curve = VGroup(pos_branch, neg_branch)
        self.play(Create(self.parent_curve), run_time=1)

        # Vertical asymptote x = 0 (RED)
        self.va_line = DashedLine(
            self.axes.c2p(0, -4), self.axes.c2p(0, 8),
            color=RED, stroke_width=2, dash_length=0.08,
        )
        # Horizontal asymptote y = 0 (BLUE)
        self.ha_line = DashedLine(
            self.axes.c2p(-6, 0), self.axes.c2p(10, 0),
            color=BLUE, stroke_width=2, dash_length=0.08,
        )
        va_label = MathTex("x = 0", font_size=26, color=RED)
        va_label.next_to(self.va_line, UL, buff=0.15)
        ha_label = MathTex("y = 0", font_size=26, color=BLUE)
        ha_label.next_to(self.ha_line, DR, buff=0.15).shift(LEFT * 0.5)

        self.play(
            Create(self.va_line), Create(self.ha_line),
            Write(va_label), Write(ha_label),
            run_time=0.8,
        )
        self.va_label_s1 = va_label
        self.ha_label_s1 = ha_label

        # Center dot at (0, 0)
        center_dot = Dot(self.axes.c2p(0, 0), color=WHITE, radius=0.07)
        center_text = Text("center (0, 0)", font_size=20, color=WHITE)
        center_text.next_to(center_dot, DR, buff=0.15)
        self.play(FadeIn(center_dot), Write(center_text), run_time=0.5)
        self.center_dot = center_dot
        self.center_text = center_text

        # Equation label (top-right)
        self.eq_label = MathTex(r"y = \frac{1}{x}", font_size=36, color=GREEN)
        self.eq_label.to_corner(UR, buff=0.6)
        self.eq_box = SurroundingRectangle(self.eq_label, color=GREEN, buff=0.12)
        self.play(Write(self.eq_label), Create(self.eq_box), run_time=0.6)
        self.wait(1)

        # Store axis labels for later cleanup
        self.axis_labels = VGroup(x_label, y_label)

    # ================================================================
    # SCENE 2 — Vertical shift (up k = 3)  (~10s)
    # ================================================================
    def scene_vertical_shift(self):
        H_SHIFT = 2
        K_SHIFT = 3
        X_RANGE = (-6, 10)
        Y_RANGE = (-4, 8)

        # Fade center label
        self.play(FadeOut(self.center_text), FadeOut(self.center_dot), run_time=0.3)

        # Dim original curve to GREY (ghost)
        ghost_curve = self.parent_curve.copy().set_color(GREY)
        self.play(
            FadeOut(self.parent_curve),
            FadeIn(ghost_curve),
            run_time=0.4,
        )
        self.ghost_curve = ghost_curve

        # ValueTracker for k
        k_tracker = ValueTracker(0)
        self.k_tracker = k_tracker

        # Helper to build two-branch curve
        def make_curve_k():
            k = k_tracker.get_value()
            left = self.axes.plot(
                lambda x, _k=k: 1.0 / x + _k,
                x_range=[X_RANGE[0], -0.15],
                color=YELLOW, stroke_width=3,
            )
            right = self.axes.plot(
                lambda x, _k=k: 1.0 / x + _k,
                x_range=[0.15, X_RANGE[1]],
                color=YELLOW, stroke_width=3,
            )
            return VGroup(left, right)

        # Redrawing curve driven by k_tracker
        dynamic_curve = always_redraw(make_curve_k)

        # Redrawing horizontal asymptote
        dynamic_ha = always_redraw(lambda: DashedLine(
            self.axes.c2p(X_RANGE[0], k_tracker.get_value()),
            self.axes.c2p(X_RANGE[1], k_tracker.get_value()),
            color=BLUE, stroke_width=2, dash_length=0.08,
        ))
        dynamic_ha_label = always_redraw(lambda: MathTex(
            f"y = {k_tracker.get_value():.0f}" if k_tracker.get_value() != 0
            else "y = 0",
            font_size=26, color=BLUE,
        ).next_to(
            self.axes.c2p(X_RANGE[1] - 0.5, k_tracker.get_value()), UR, buff=0.15,
        ))

        # Swap static HA for dynamic; keep static VA
        self.play(
            FadeOut(self.ha_line), FadeOut(self.ha_label_s1),
            run_time=0.3,
        )
        self.add(dynamic_curve, dynamic_ha, dynamic_ha_label)

        # Annotation
        shift_up_text = Text("Up 3  \u2192  add 3 outside", font_size=28, color=BLUE)
        shift_up_text.to_edge(DOWN, buff=0.45)
        self.play(Write(shift_up_text), run_time=0.5)

        # Animate k from 0 -> 3
        self.play(
            k_tracker.animate.set_value(K_SHIFT),
            run_time=2, rate_func=smooth,
        )
        self.wait(0.3)

        # Morph equation
        eq_new = MathTex(r"y = \frac{1}{x}", r"+ 3", font_size=36, color=GREEN)
        eq_new.to_corner(UR, buff=0.6)
        eq_box_new = SurroundingRectangle(eq_new, color=GREEN, buff=0.12)

        self.play(
            Transform(self.eq_label, eq_new),
            Transform(self.eq_box, eq_box_new),
            run_time=0.8,
        )
        self.wait(1)

        # Store refs for scene 3 cleanup
        self.shift_up_text = shift_up_text
        self.dynamic_curve_s2 = dynamic_curve
        self.dynamic_ha = dynamic_ha
        self.dynamic_ha_label = dynamic_ha_label

    # ================================================================
    # SCENE 3 — Horizontal shift (right h = 2) — OPPOSITE SIGN TRAP  (~10s)
    # ================================================================
    def scene_horizontal_shift(self):
        H_SHIFT = 2
        K_SHIFT = 3
        X_RANGE = (-6, 10)
        Y_RANGE = (-4, 8)

        self.play(FadeOut(self.shift_up_text), run_time=0.3)

        h_tracker = ValueTracker(0)

        # Remove scene-2 dynamic objects; replace with h-aware versions
        self.remove(
            self.dynamic_curve_s2, self.dynamic_ha, self.dynamic_ha_label,
        )

        # Helper to build two-branch curve with h and fixed k=3
        def make_curve_hk():
            h = h_tracker.get_value()
            left = self.axes.plot(
                lambda x, _h=h: 1.0 / (x - _h) + K_SHIFT,
                x_range=[X_RANGE[0], h - 0.15],
                color=YELLOW, stroke_width=3,
            )
            right = self.axes.plot(
                lambda x, _h=h: 1.0 / (x - _h) + K_SHIFT,
                x_range=[h + 0.15, X_RANGE[1]],
                color=YELLOW, stroke_width=3,
            )
            return VGroup(left, right)

        dynamic_curve_2 = always_redraw(make_curve_hk)

        # Dynamic vertical asymptote
        dynamic_va = always_redraw(lambda: DashedLine(
            self.axes.c2p(h_tracker.get_value(), Y_RANGE[0]),
            self.axes.c2p(h_tracker.get_value(), Y_RANGE[1]),
            color=RED, stroke_width=2, dash_length=0.08,
        ))
        dynamic_va_label = always_redraw(lambda: MathTex(
            f"x = {h_tracker.get_value():.0f}" if h_tracker.get_value() != 0
            else "x = 0",
            font_size=26, color=RED,
        ).next_to(
            self.axes.c2p(h_tracker.get_value(), Y_RANGE[1] - 0.5), UL, buff=0.15,
        ))

        # Static HA at y = 3 (stays fixed during h-shift)
        static_ha_3 = DashedLine(
            self.axes.c2p(X_RANGE[0], K_SHIFT),
            self.axes.c2p(X_RANGE[1], K_SHIFT),
            color=BLUE, stroke_width=2, dash_length=0.08,
        )
        static_ha_3_label = MathTex("y = 3", font_size=26, color=BLUE)
        static_ha_3_label.next_to(
            self.axes.c2p(X_RANGE[1] - 0.5, K_SHIFT), UR, buff=0.15,
        )

        # Swap
        self.play(
            FadeOut(self.va_line), FadeOut(self.va_label_s1),
            run_time=0.3,
        )
        self.add(dynamic_curve_2, dynamic_va, dynamic_va_label)
        self.add(static_ha_3, static_ha_3_label)

        # Horizontal shift annotation — emphasize opposite sign
        shift_right_text = VGroup(
            Text("Right 2  \u2192  ", font_size=28, color=WHITE),
            MathTex(r"(x - 2)", font_size=36, color=RED),
        ).arrange(RIGHT, buff=0.15)
        trap_warning = Text("OPPOSITE sign inside!", font_size=30, color=RED)
        shift_group = VGroup(shift_right_text, trap_warning).arrange(DOWN, buff=0.2)
        shift_group.to_edge(DOWN, buff=0.35)

        self.play(Write(shift_right_text), run_time=0.5)

        # Animate h from 0 -> 2
        self.play(
            h_tracker.animate.set_value(H_SHIFT),
            run_time=2, rate_func=smooth,
        )
        self.wait(0.3)

        # Flash the trap warning
        self.play(Write(trap_warning), run_time=0.5)
        self.play(
            Indicate(trap_warning, color=RED, scale_factor=1.15),
            run_time=0.8,
        )
        self.wait(0.5)

        # Morph equation to final form
        eq_final = MathTex(
            r"y = \frac{1}{x - 2} + 3",
            font_size=36, color=GREEN,
        )
        eq_final.to_corner(UR, buff=0.6)
        eq_box_final = SurroundingRectangle(eq_final, color=GREEN, buff=0.12)

        self.play(
            Transform(self.eq_label, eq_final),
            Transform(self.eq_box, eq_box_final),
            run_time=0.8,
        )

        # Mark new center at (2, 3)
        new_center = Dot(self.axes.c2p(H_SHIFT, K_SHIFT), color=WHITE, radius=0.08)
        new_center_label = Text("(2, 3)", font_size=22, color=WHITE)
        new_center_label.next_to(new_center, UR, buff=0.15)
        self.play(
            FadeIn(new_center, scale=1.5), Write(new_center_label),
            run_time=0.6,
        )
        self.wait(1)

        # Collect everything on screen for scene 4 fade-out
        self.graph_group = VGroup(
            self.axes, self.axis_labels,
            self.ghost_curve,
            dynamic_curve_2, dynamic_va, dynamic_va_label,
            static_ha_3, static_ha_3_label,
            self.eq_label, self.eq_box,
            new_center, new_center_label,
            shift_group,
        )

    # ================================================================
    # SCENE 4 — Summary pattern card  (~8s)
    # ================================================================
    def scene_summary_pattern(self):
        # Fade out the entire graph
        self.play(FadeOut(self.graph_group), run_time=0.6)

        # Large centered pattern equation
        pattern_eq = MathTex(
            r"y = \frac{1}{x - h} + k",
            font_size=48, color=GREEN,
        )

        # Rule lines
        rule_h = VGroup(
            Text("Right ", font_size=24, color=WHITE),
            MathTex("h", font_size=28, color=WHITE),
            Text("  \u2192  ", font_size=24, color=WHITE),
            MathTex(r"(x - h)", font_size=28, color=RED),
            Text("  opposite", font_size=24, color=RED),
        ).arrange(RIGHT, buff=0.08)

        rule_k = VGroup(
            Text("Up ", font_size=24, color=WHITE),
            MathTex("k", font_size=28, color=WHITE),
            Text("  \u2192  ", font_size=24, color=WHITE),
            MathTex(r"+ k", font_size=28, color=BLUE),
            Text("  same", font_size=24, color=BLUE),
        ).arrange(RIGHT, buff=0.08)

        # Assemble the card
        pattern_card = VGroup(
            pattern_eq, rule_h, rule_k,
        ).arrange(DOWN, buff=0.35, aligned_edge=LEFT)
        pattern_card.move_to(ORIGIN)

        card_box = SurroundingRectangle(
            pattern_card, color=GOLD, buff=0.3, corner_radius=0.12,
        )

        # Animate in stages
        self.play(Write(pattern_eq), run_time=0.8)
        self.play(Write(rule_h), run_time=0.6)
        self.play(Write(rule_k), run_time=0.6)
        self.play(Create(card_box), run_time=0.5)

        # Final flash on "opposite sign" rule
        self.play(
            Indicate(rule_h[3], color=RED, scale_factor=1.2),
            Indicate(rule_h[4], color=RED, scale_factor=1.2),
            run_time=0.8,
        )
        self.wait(2.5)
