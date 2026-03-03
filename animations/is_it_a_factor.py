"""
Is It a Factor? — Using the graph and P(a) to determine if (x - a) is a factor.
Visual proof: a root on the graph (P(a)=0) means (x-a) is a factor.
For Algebra 2 students learning the Factor Theorem.

Run with: manim -qm --format=mp4 is_it_a_factor.py IsItAFactor
"""
from manim import *


class IsItAFactor(Scene):
    def construct(self):
        # ── Color palette ──────────────────────────────────────────────
        CURVE_COLOR = ManimColor("#58C4DD")   # blue
        YES_COLOR = ManimColor("#83C167")     # green
        NO_COLOR = ManimColor("#FC6255")      # red
        ACCENT = ManimColor("#FFFF00")        # yellow
        SOFT_GREY = ManimColor("#AAAAAA")

        # ── Helper: P(x) = x^3 - 6x^2 + 11x - 6 ─────────────────────
        def P(x):
            return x ** 3 - 6 * x ** 2 + 11 * x - 6

        # ── 1. Title ──────────────────────────────────────────────────
        title = Text("Factor or Not? Check P(a)!", font_size=48)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1)
        self.wait(0.5)

        # ── 2. Axes and graph ─────────────────────────────────────────
        axes = Axes(
            x_range=[-0.5, 5, 1],
            y_range=[-5, 5, 1],
            x_length=8,
            y_length=5,
            axis_config={"include_numbers": True, "font_size": 22},
            tips=False,
        )
        axes.shift(DOWN * 0.5)

        axis_labels = axes.get_axis_labels(
            MathTex("x", font_size=28),
            MathTex("P(x)", font_size=28),
        )

        graph = axes.plot(P, x_range=[-0.3, 4.6], color=CURVE_COLOR, stroke_width=3)

        poly_label = MathTex(
            "P(x) = x^3 - 6x^2 + 11x - 6",
            font_size=28,
            color=CURVE_COLOR,
        )
        poly_label.next_to(axes, UP, buff=0.15).shift(RIGHT * 1.5)

        self.play(
            title.animate.scale(0.7).to_corner(UL, buff=0.3),
            run_time=0.8,
        )
        self.play(Create(axes), Write(axis_labels), run_time=1)
        self.play(Create(graph), run_time=1.5)
        self.play(FadeIn(poly_label, shift=DOWN * 0.2), run_time=0.6)
        self.wait(0.5)

        # ── helper to draw dashed line from dot to x-axis ─────────────
        def make_vdash(ax, xv, yv, color):
            """Vertical dashed line from (x, y) down to (x, 0)."""
            top = ax.c2p(xv, yv)
            bot = ax.c2p(xv, 0)
            return DashedLine(top, bot, color=color, dash_length=0.08, stroke_width=2)

        # ==============================================================
        # ── 3. TEST 1:  (x - 1)  — IS a factor ───────────────────────
        # ==============================================================
        q1 = Text("Is (x - 1) a factor?", font_size=30)
        q1.to_edge(RIGHT, buff=0.4).shift(UP * 2.5)
        self.play(Write(q1), run_time=0.7)

        # Animate dot travelling along curve from x=0 to x=1
        x_tracker1 = ValueTracker(0)
        dot1 = always_redraw(lambda: Dot(
            axes.c2p(x_tracker1.get_value(), P(x_tracker1.get_value())),
            radius=0.1,
            color=WHITE,
        ))
        self.add(dot1)
        self.play(x_tracker1.animate.set_value(1), run_time=1.5, rate_func=smooth)

        # Dot lands on x-axis — turn green
        dot1_final = Dot(axes.c2p(1, 0), radius=0.12, color=YES_COLOR)
        vdash1 = make_vdash(axes, 1, P(0.5), YES_COLOR)  # cosmetic dash

        self.remove(dot1)
        self.play(FadeIn(dot1_final, scale=1.5), run_time=0.4)

        # Computation line
        calc1 = MathTex(
            "P(1) = 1 - 6 + 11 - 6 = 0",
            font_size=26,
        )
        calc1.set_color(YES_COLOR)
        calc1.next_to(q1, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(calc1), run_time=0.8)

        # Checkmark
        check1 = MathTex("\\checkmark", font_size=48, color=YES_COLOR)
        check1.next_to(dot1_final, UP, buff=0.2)
        self.play(FadeIn(check1, scale=0.5), run_time=0.4)

        result1 = Text("YES, (x - 1) is a factor!", font_size=24, color=YES_COLOR)
        result1.next_to(calc1, DOWN, buff=0.25, aligned_edge=LEFT)
        self.play(Write(result1), run_time=0.7)
        self.wait(0.8)

        # Fade test 1 sidebar text (keep dot and checkmark)
        self.play(FadeOut(q1), FadeOut(calc1), FadeOut(result1), run_time=0.5)

        # ==============================================================
        # ── 4. TEST 2:  (x - 3)  — IS a factor ───────────────────────
        # ==============================================================
        q2 = Text("Is (x - 3) a factor?", font_size=30)
        q2.to_edge(RIGHT, buff=0.4).shift(UP * 2.5)
        self.play(Write(q2), run_time=0.7)

        # Animate dot along curve from x=1 to x=3
        x_tracker2 = ValueTracker(1)
        dot2 = always_redraw(lambda: Dot(
            axes.c2p(x_tracker2.get_value(), P(x_tracker2.get_value())),
            radius=0.1,
            color=WHITE,
        ))
        self.add(dot2)
        self.play(x_tracker2.animate.set_value(3), run_time=1.5, rate_func=smooth)

        # Dot lands on x-axis — green
        dot2_final = Dot(axes.c2p(3, 0), radius=0.12, color=YES_COLOR)
        self.remove(dot2)
        self.play(FadeIn(dot2_final, scale=1.5), run_time=0.4)

        calc2 = MathTex(
            "P(3) = 27 - 54 + 33 - 6 = 0",
            font_size=26,
        )
        calc2.set_color(YES_COLOR)
        calc2.next_to(q2, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(calc2), run_time=0.8)

        check2 = MathTex("\\checkmark", font_size=48, color=YES_COLOR)
        check2.next_to(dot2_final, UP, buff=0.2)
        self.play(FadeIn(check2, scale=0.5), run_time=0.4)

        result2 = Text("YES, (x - 3) is a factor!", font_size=24, color=YES_COLOR)
        result2.next_to(calc2, DOWN, buff=0.25, aligned_edge=LEFT)
        self.play(Write(result2), run_time=0.7)
        self.wait(0.8)

        self.play(FadeOut(q2), FadeOut(calc2), FadeOut(result2), run_time=0.5)

        # ==============================================================
        # ── 5. TEST 3:  (x - 4)  — NOT a factor ──────────────────────
        # ==============================================================
        q3 = Text("Is (x - 4) a factor?", font_size=30)
        q3.to_edge(RIGHT, buff=0.4).shift(UP * 2.5)
        self.play(Write(q3), run_time=0.7)

        # Animate dot along curve from x=3 to x=4
        x_tracker3 = ValueTracker(3)
        dot3 = always_redraw(lambda: Dot(
            axes.c2p(x_tracker3.get_value(), P(x_tracker3.get_value())),
            radius=0.1,
            color=WHITE,
        ))
        self.add(dot3)
        self.play(x_tracker3.animate.set_value(4), run_time=1.5, rate_func=smooth)

        # Dot is ABOVE x-axis (P(4) = 6) — RED
        dot3_final = Dot(axes.c2p(4, 6), radius=0.12, color=NO_COLOR)
        self.remove(dot3)
        self.play(FadeIn(dot3_final, scale=1.5), run_time=0.4)

        # Dashed line showing gap to x-axis
        vdash3 = DashedLine(
            axes.c2p(4, 6), axes.c2p(4, 0),
            color=NO_COLOR,
            dash_length=0.1,
            stroke_width=2,
        )
        self.play(Create(vdash3), run_time=0.5)

        # Bracket / label showing the gap = 6
        gap_label = MathTex("6", font_size=26, color=NO_COLOR)
        gap_label.next_to(vdash3, RIGHT, buff=0.15)
        self.play(FadeIn(gap_label), run_time=0.3)

        calc3 = MathTex(
            "P(4) = 64 - 96 + 44 - 6 = 6",
            font_size=26,
        )
        calc3.set_color(NO_COLOR)
        calc3.next_to(q3, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(calc3), run_time=0.8)

        neq = MathTex("\\neq 0", font_size=30, color=NO_COLOR)
        neq.next_to(calc3, RIGHT, buff=0.15)
        self.play(Write(neq), run_time=0.4)

        # Red X mark
        cross = VGroup(
            Line(UL * 0.15, DR * 0.15, color=NO_COLOR, stroke_width=4),
            Line(UR * 0.15, DL * 0.15, color=NO_COLOR, stroke_width=4),
        )
        cross.move_to(dot3_final.get_center() + UP * 0.35)
        self.play(Create(cross), run_time=0.4)

        result3 = Text("NO, (x - 4) is NOT a factor!", font_size=24, color=NO_COLOR)
        result3.next_to(calc3, DOWN, buff=0.25, aligned_edge=LEFT)
        self.play(Write(result3), run_time=0.7)
        self.wait(1)

        # ==============================================================
        # ── 6. Clear and show final rule ──────────────────────────────
        # ==============================================================
        everything = VGroup(
            title, poly_label, axes, axis_labels, graph,
            dot1_final, check1,
            dot2_final, check2,
            dot3_final, cross, vdash3, gap_label,
            q3, calc3, neq, result3,
        )
        self.play(FadeOut(everything), run_time=0.8)

        # Rule box — the Factor Theorem
        rule_title = Text("The Factor Theorem", font_size=44, color=ACCENT)
        rule_title.shift(UP * 2)

        rule_math = MathTex(
            "P(a) = 0 \\;\\Longleftrightarrow\\; (x - a) \\textrm{ is a factor of } P(x)",
            font_size=34,
        )
        rule_math.next_to(rule_title, DOWN, buff=0.5)

        self.play(Write(rule_title), run_time=0.8)
        self.play(Write(rule_math), run_time=1)
        self.wait(0.5)

        rule_box = SurroundingRectangle(
            VGroup(rule_title, rule_math),
            color=ACCENT,
            buff=0.35,
            corner_radius=0.15,
        )
        self.play(Create(rule_box), run_time=0.8)
        self.wait(0.5)

        # Equivalence trio
        trio_text = Text(
            "Factor  =  Root  =  Zero of the function",
            font_size=30,
            color=SOFT_GREY,
        )
        trio_text.next_to(rule_box, DOWN, buff=0.6)
        self.play(FadeIn(trio_text, shift=UP * 0.2), run_time=0.8)
        self.wait(0.5)

        # Visual summary — mini icons
        green_dot = Dot(radius=0.08, color=YES_COLOR)
        green_label = Text("touches x-axis", font_size=22, color=YES_COLOR)
        green_label.next_to(green_dot, RIGHT, buff=0.15)
        green_row = VGroup(green_dot, green_label)

        red_dot = Dot(radius=0.08, color=NO_COLOR)
        red_label = Text("misses x-axis", font_size=22, color=NO_COLOR)
        red_label.next_to(red_dot, RIGHT, buff=0.15)
        red_row = VGroup(red_dot, red_label)

        icon_group = VGroup(green_row, red_row).arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        icon_group.next_to(trio_text, DOWN, buff=0.5)

        arrow_yes = MathTex("\\Rightarrow", font_size=28, color=YES_COLOR)
        arrow_yes.next_to(green_label, RIGHT, buff=0.15)
        yes_tag = Text("IS a factor", font_size=22, color=YES_COLOR)
        yes_tag.next_to(arrow_yes, RIGHT, buff=0.15)

        arrow_no = MathTex("\\Rightarrow", font_size=28, color=NO_COLOR)
        arrow_no.next_to(red_label, RIGHT, buff=0.15)
        no_tag = Text("NOT a factor", font_size=22, color=NO_COLOR)
        no_tag.next_to(arrow_no, RIGHT, buff=0.15)

        self.play(
            FadeIn(green_row), FadeIn(arrow_yes), FadeIn(yes_tag),
            FadeIn(red_row), FadeIn(arrow_no), FadeIn(no_tag),
            run_time=1,
        )
        self.wait(2.5)
