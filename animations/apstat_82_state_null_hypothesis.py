"""
Show that the null hypothesis states equality to specified proportions.

Render:
manim -qm --format=mp4 animations/apstat_82_state_null_hypothesis.py NullHypothesisEquality
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class NullHypothesisEquality(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("H₀ States Equality", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "The null says the population distribution matches the specified values",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        model_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.2,
            height=3.2,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        model_box.set_fill(BLUE_3B1B, opacity=0.1)
        model_title = Text("Specified Model", font_size=26, color=BLUE_3B1B, weight=BOLD)
        model_title.move_to(model_box.get_top() + DOWN * 0.45)

        p1 = Text("p₁ = 0.452", font_size=28, color=WHITE)
        p2 = Text("p₂ = 0.292", font_size=28, color=WHITE)
        p3 = Text("p₃ = 0.256", font_size=28, color=WHITE)
        probs = VGroup(p1, p2, p3).arrange(DOWN, buff=0.22)
        probs.move_to(model_box.get_center() + DOWN * 0.35)
        left_panel = VGroup(model_box, model_title, probs)
        left_panel.shift(LEFT * 3.0 + DOWN * 0.15)

        equal_sign = Text("=", font_size=62, color=YELLOW_3B1B, weight=BOLD)
        equal_sign.move_to(DOWN * 0.1)

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.6,
            height=3.2,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(GREEN_3B1B, opacity=0.1)
        right_title = Text("What H₀ Says", font_size=26, color=GREEN_3B1B, weight=BOLD)
        right_title.move_to(right_box.get_top() + DOWN * 0.45)
        right_text = Text(
            "Population\nproportions\nmatch the\nmodel values",
            font_size=26,
            color=WHITE,
            line_spacing=0.9,
        )
        right_text.move_to(right_box.get_center() + DOWN * 0.1)
        right_panel = VGroup(right_box, right_title, right_text)
        right_panel.shift(RIGHT * 3.0 + DOWN * 0.15)

        footer = Text(
            "Use parameters, not sample proportions",
            font_size=22,
            color=PINK_3B1B,
            weight=BOLD,
        )
        footer.move_to(DOWN * 3.2)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.4)
        self.play(DrawBorderThenFill(model_box), Write(model_title), run_time=1.2)
        self.play(LaggedStart(*(Write(line) for line in probs), lag_ratio=0.18), run_time=1.8)
        self.play(FadeIn(equal_sign, scale=0.7), run_time=0.8)
        self.play(DrawBorderThenFill(right_box), Write(right_title), Write(right_text), run_time=1.8)
        self.wait(0.6)
        self.play(
            Indicate(p1, color=YELLOW_3B1B),
            Indicate(p2, color=YELLOW_3B1B),
            Indicate(p3, color=YELLOW_3B1B),
            run_time=1.6,
        )
        self.play(Circumscribe(right_box, color=GREEN_3B1B, time_width=1.2), run_time=1.2)
        self.play(FadeIn(footer, shift=UP * 0.2), run_time=1.1)
        self.wait(2.6)
