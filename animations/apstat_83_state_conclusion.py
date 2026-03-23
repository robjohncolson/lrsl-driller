"""
Show how to compare the p-value to alpha and state a conclusion in context.

Render:
manim -qm --format=mp4 animations/apstat_83_state_conclusion.py ChiSquareConclusionInContext
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ChiSquareConclusionInContext(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("State the Conclusion", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Compare the p-value to α, then write the decision in context",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        p_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.5,
            height=1.6,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        p_box.set_fill(BLUE_3B1B, opacity=0.1)
        p_text = Text("p = 0.0208", font_size=30, color=WHITE, weight=BOLD)
        p_text.move_to(p_box.get_center())
        p_group = VGroup(p_box, p_text)
        p_group.shift(LEFT * 2.4 + UP * 1.0)

        alpha_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.5,
            height=1.6,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        alpha_box.set_fill(TEAL_3B1B, opacity=0.1)
        alpha_text = Text("α = 0.05", font_size=30, color=WHITE, weight=BOLD)
        alpha_text.move_to(alpha_box.get_center())
        alpha_group = VGroup(alpha_box, alpha_text)
        alpha_group.shift(RIGHT * 2.4 + UP * 1.0)

        compare = Text("0.0208 ≤ 0.05", font_size=34, color=YELLOW_3B1B, weight=BOLD)
        compare.move_to(UP * 0.05)

        decision_box = RoundedRectangle(
            corner_radius=0.22,
            width=4.8,
            height=1.5,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        decision_box.set_fill(GREEN_3B1B, opacity=0.12)
        decision_text = Text("Reject H₀", font_size=30, color=GREEN_3B1B, weight=BOLD)
        decision_text.move_to(decision_box.get_center())
        decision_group = VGroup(decision_box, decision_text)
        decision_group.shift(DOWN * 1.35)

        context_box = RoundedRectangle(
            corner_radius=0.22,
            width=10.4,
            height=1.95,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        context_box.set_fill(PINK_3B1B, opacity=0.08)
        context_box.to_edge(DOWN, buff=0.45)
        context_text = Text(
            "There is convincing statistical evidence that the\nincome-bracket distribution is not as specified",
            font_size=24,
            color=WHITE,
            line_spacing=0.9,
        )
        context_text.move_to(context_box.get_center())

        left_arrow = Arrow(
            p_group.get_bottom() + DOWN * 0.05,
            compare.get_top() + LEFT * 0.7,
            buff=0.15,
            color=BLUE_3B1B,
            stroke_width=5,
        )
        right_arrow = Arrow(
            alpha_group.get_bottom() + DOWN * 0.05,
            compare.get_top() + RIGHT * 0.7,
            buff=0.15,
            color=TEAL_3B1B,
            stroke_width=5,
        )
        down_arrow = Arrow(
            compare.get_bottom() + DOWN * 0.08,
            decision_group.get_top() + UP * 0.08,
            buff=0.15,
            color=YELLOW_3B1B,
            stroke_width=5,
        )

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.2)
        self.play(DrawBorderThenFill(p_box), Write(p_text), run_time=1.0)
        self.play(DrawBorderThenFill(alpha_box), Write(alpha_text), run_time=1.0)
        self.play(GrowArrow(left_arrow), GrowArrow(right_arrow), Write(compare), run_time=1.2)
        self.play(GrowArrow(down_arrow), DrawBorderThenFill(decision_box), Write(decision_text), run_time=1.3)
        self.play(DrawBorderThenFill(context_box), Write(context_text), run_time=1.6)
        self.wait(1.8)
