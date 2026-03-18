"""
Level 5: Translate the Parent Function y = 1/x

Shows how horizontal and vertical translations transform the reciprocal
function, with special emphasis on the "opposite sign" trap inside the
denominator.  3Blue1Brown style with smooth ValueTracker animations.

Run with: manim -qm --format=mp4 a2t4l1_05_translate_parent.py TranslateParentScene
"""
from manim import *
import numpy as np


class TranslateParentScene(Scene):
    def construct(self):
        # ── Parameters ──────────────────────────────────────────────────
        H_SHIFT = 2       # horizontal shift (right)
        K_SHIFT = 3       # vertical shift (up)
        X_RANGE = (-6, 8)
        Y_RANGE = (-4, 8)

        # ── Reusable helpers ────────────────────────────────────────────
        def recip(x, h=0, k=0):
            denom = x - h
            if abs(denom) < 0.05:
                return None
            return 1.0 / denom + k

        def make_curve(axes, h, k, color=YELLOW):
            """Return two separate curves (one per branch) for y = 1/(x-h) + k."""
            left = axes.plot(
                lambda x: 1.0 / (x - h) + k,
                x_range=[X_RANGE[0], h - 0.15],
                color=color,
                stroke_width=3,
            )
            right = axes.plot(
                lambda x: 1.0 / (x - h) + k,
                x_range=[h + 0.15, X_RANGE[1]],
                color=color,
                stroke_width=3,
            )
            return VGroup(left, right)

        # ================================================================
        # SCENE 1 — Parent function y = 1/x with asymptotes
        # ================================================================
        title = Text("Translating  y = 1/x", font_size=42)
        title.to_edge(UP, buff=0.35)
        self.play(Write(title))
        self.wait(0.3)

        axes = Axes(
            x_range=[X_RANGE[0], X_RANGE[1], 1],
            y_range=[Y_RANGE[0], Y_RANGE[1], 1],
            x_length=10,
            y_length=7,
            axis_config={"include_tip": True, "tip_width": 0.15, "tip_height": 0.15},
        ).shift(DOWN * 0.3)

        x_label = axes.get_x_axis_label("x", direction=RIGHT)
        y_label = axes.get_y_axis_label("y", direction=UP)

        self.play(Create(axes), Write(x_label), Write(y_label), run_time=1)

        # Parent curve
        parent_curve = make_curve(axes, 0, 0)
        self.play(Create(parent_curve), run_time=1)

        # Asymptotes
        va_line = DashedLine(
            axes.c2p(0, Y_RANGE[0]), axes.c2p(0, Y_RANGE[1]),
            color=RED, stroke_width=2, dash_length=0.08,
        )
        ha_line = DashedLine(
            axes.c2p(X_RANGE[0], 0), axes.c2p(X_RANGE[1], 0),
            color=BLUE, stroke_width=2, dash_length=0.08,
        )
        va_label = MathTex("x = 0", font_size=26, color=RED)
        va_label.next_to(va_line, UL, buff=0.15)
        ha_label = MathTex("y = 0", font_size=26, color=BLUE)
        ha_label.next_to(ha_line, DR, buff=0.15).shift(LEFT * 0.5)

        self.play(
            Create(va_line), Create(ha_line),
            Write(va_label), Write(ha_label),
            run_time=0.8,
        )

        # Center dot at (0, 0)
        center_dot = Dot(axes.c2p(0, 0), color=WHITE, radius=0.07)
        center_text = Text("center (0, 0)", font_size=20, color=WHITE)
        center_text.next_to(center_dot, DR, buff=0.15)
        self.play(FadeIn(center_dot), Write(center_text), run_time=0.5)

        # Equation label
        eq_label = MathTex(r"y = \frac{1}{x}", font_size=36, color=GREEN)
        eq_label.to_corner(UR, buff=0.6)
        eq_box = SurroundingRectangle(eq_label, color=GREEN, buff=0.12)
        self.play(Write(eq_label), Create(eq_box), run_time=0.6)
        self.wait(1)

        # ================================================================
        # SCENE 2 — Vertical shift (up k = 3) using ValueTracker
        # ================================================================
        # Fade center label; we will redraw later
        self.play(FadeOut(center_text), FadeOut(center_dot), run_time=0.3)

        k_tracker = ValueTracker(0)

        # Redrawing curve
        dynamic_curve = always_redraw(
            lambda: make_curve(axes, 0, k_tracker.get_value())
        )
        # Redrawing horizontal asymptote
        dynamic_ha = always_redraw(lambda: DashedLine(
            axes.c2p(X_RANGE[0], k_tracker.get_value()),
            axes.c2p(X_RANGE[1], k_tracker.get_value()),
            color=BLUE, stroke_width=2, dash_length=0.08,
        ))
        dynamic_ha_label = always_redraw(lambda: MathTex(
            f"y = {k_tracker.get_value():.0f}" if k_tracker.get_value() != 0
            else "y = 0",
            font_size=26, color=BLUE,
        ).next_to(
            axes.c2p(X_RANGE[1] - 0.5, k_tracker.get_value()), UR, buff=0.15,
        ))

        # Swap static objects for dynamic ones
        self.play(
            FadeOut(parent_curve), FadeOut(ha_line), FadeOut(ha_label),
            run_time=0.3,
        )
        self.add(dynamic_curve, dynamic_ha, dynamic_ha_label)

        # Vertical shift annotation
        shift_up_text = Text("Up 3  →  add 3 outside", font_size=28, color=BLUE)
        shift_up_text.to_edge(DOWN, buff=0.45)
        self.play(Write(shift_up_text), run_time=0.5)

        # Animate k from 0 → 3
        self.play(k_tracker.animate.set_value(K_SHIFT), run_time=2.5, rate_func=smooth)
        self.wait(0.3)

        # Morph equation
        eq_new_1 = MathTex(r"y = \frac{1}{x}", r"+ 3", font_size=36, color=GREEN)
        eq_new_1.to_corner(UR, buff=0.6)
        eq_box_new_1 = SurroundingRectangle(eq_new_1, color=GREEN, buff=0.12)

        self.play(
            Transform(eq_label, eq_new_1),
            Transform(eq_box, eq_box_new_1),
            run_time=0.8,
        )
        self.wait(1)

        # ================================================================
        # SCENE 3 — Horizontal shift (right h = 2) — OPPOSITE SIGN TRAP
        # ================================================================
        self.play(FadeOut(shift_up_text), run_time=0.3)

        h_tracker = ValueTracker(0)

        # Replace curve and VA with h-aware versions
        self.remove(dynamic_curve, dynamic_ha, dynamic_ha_label)

        dynamic_curve_2 = always_redraw(
            lambda: make_curve(axes, h_tracker.get_value(), K_SHIFT)
        )
        dynamic_va = always_redraw(lambda: DashedLine(
            axes.c2p(h_tracker.get_value(), Y_RANGE[0]),
            axes.c2p(h_tracker.get_value(), Y_RANGE[1]),
            color=RED, stroke_width=2, dash_length=0.08,
        ))
        dynamic_va_label = always_redraw(lambda: MathTex(
            f"x = {h_tracker.get_value():.0f}" if h_tracker.get_value() != 0
            else "x = 0",
            font_size=26, color=RED,
        ).next_to(
            axes.c2p(h_tracker.get_value(), Y_RANGE[1] - 0.5), UL, buff=0.15,
        ))
        # Keep the HA at y = 3
        static_ha_3 = DashedLine(
            axes.c2p(X_RANGE[0], K_SHIFT), axes.c2p(X_RANGE[1], K_SHIFT),
            color=BLUE, stroke_width=2, dash_length=0.08,
        )
        static_ha_3_label = MathTex("y = 3", font_size=26, color=BLUE)
        static_ha_3_label.next_to(axes.c2p(X_RANGE[1] - 0.5, K_SHIFT), UR, buff=0.15)

        # Swap
        self.play(FadeOut(va_line), FadeOut(va_label), run_time=0.3)
        self.add(dynamic_curve_2, dynamic_va, dynamic_va_label)
        self.add(static_ha_3, static_ha_3_label)

        # Horizontal shift annotation — emphasize opposite sign
        shift_right_text = VGroup(
            Text("Right 2  →  ", font_size=28, color=WHITE),
            MathTex(r"(x - 2)", font_size=36, color=RED),
        ).arrange(RIGHT, buff=0.15)
        trap_warning = Text("OPPOSITE sign inside!", font_size=30, color=RED)
        shift_group = VGroup(shift_right_text, trap_warning).arrange(DOWN, buff=0.2)
        shift_group.to_edge(DOWN, buff=0.35)

        self.play(Write(shift_right_text), run_time=0.5)

        # Animate h from 0 → 2
        self.play(h_tracker.animate.set_value(H_SHIFT), run_time=2.5, rate_func=smooth)
        self.wait(0.3)

        # Flash the trap warning
        self.play(Write(trap_warning), run_time=0.5)
        self.play(Indicate(trap_warning, color=RED, scale_factor=1.15), run_time=0.8)
        self.wait(0.5)

        # Morph equation to final form
        eq_final = MathTex(
            r"y = \frac{1}{x - 2} + 3",
            font_size=36, color=GREEN,
        )
        eq_final.to_corner(UR, buff=0.6)
        eq_box_final = SurroundingRectangle(eq_final, color=GREEN, buff=0.12)

        self.play(
            Transform(eq_label, eq_final),
            Transform(eq_box, eq_box_final),
            run_time=0.8,
        )
        self.wait(1)

        # ================================================================
        # SCENE 4 — Final summary: labeled graph + boxed pattern
        # ================================================================
        self.play(FadeOut(shift_group), run_time=0.4)

        # Mark the new center (h, k) = (2, 3)
        new_center = Dot(axes.c2p(H_SHIFT, K_SHIFT), color=WHITE, radius=0.08)
        new_center_label = Text("center (2, 3)", font_size=22, color=WHITE)
        new_center_label.next_to(new_center, UR, buff=0.15)
        self.play(FadeIn(new_center, scale=1.5), Write(new_center_label), run_time=0.6)
        self.wait(0.5)

        # Build the boxed pattern card
        pattern_title = Text("Translation Pattern", font_size=28, color=WHITE)
        pattern_eq = MathTex(
            r"y = \frac{1}{x - h} + k",
            font_size=34, color=GREEN,
        )
        rule_h = VGroup(
            Text("Right ", font_size=22, color=WHITE),
            MathTex("h", font_size=26, color=WHITE),
            Text("  →  ", font_size=22, color=WHITE),
            MathTex(r"(x - h)", font_size=26, color=RED),
            Text("  opposite", font_size=22, color=RED),
        ).arrange(RIGHT, buff=0.08)
        rule_k = VGroup(
            Text("Up ", font_size=22, color=WHITE),
            MathTex("k", font_size=26, color=WHITE),
            Text("  →  ", font_size=22, color=WHITE),
            MathTex(r"+ k", font_size=26, color=BLUE),
            Text("  same", font_size=22, color=BLUE),
        ).arrange(RIGHT, buff=0.08)

        pattern_card = VGroup(
            pattern_title, pattern_eq, rule_h, rule_k,
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT)
        pattern_card.to_edge(DOWN, buff=0.3)

        card_box = SurroundingRectangle(
            pattern_card, color=YELLOW, buff=0.2, corner_radius=0.12,
        )

        self.play(
            Write(pattern_title), Write(pattern_eq),
            run_time=0.8,
        )
        self.play(Write(rule_h), run_time=0.6)
        self.play(Write(rule_k), run_time=0.6)
        self.play(Create(card_box), run_time=0.5)

        # Final flash on the "opposite sign" rule
        self.play(
            Indicate(rule_h[3], color=RED, scale_factor=1.2),
            Indicate(rule_h[4], color=RED, scale_factor=1.2),
            run_time=0.8,
        )
        self.wait(2.5)
