"""
Two Possible Explanations for Any Study Result (AP Stats Unit 6, Topic 6.1)

Presents the fundamental concept that every study result has exactly two
explanations: (1) it happened by random chance alone, or (2) there is a real
effect. Uses a medical trial scenario (48/80 patients improved, p-hat = 0.60)
and a fork animation that splits the screen into two paths — Chance (left,
yellow) and Real Effect (right, teal). Ends with a key insight box.

Run with: manim -qm --format=mp4 apstat_61_two_explanations.py TwoExplanations
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoExplanations(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Two Possible Explanations", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "For any study result",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== PART 1: Show the Scenario ==========
        scenario_header = Text("The Study", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        scenario_header.next_to(subtitle, DOWN, buff=0.35)
        self.play(Write(scenario_header))
        self.wait(0.2)

        scenario_lines = VGroup(
            Text("A new treatment is tested on 80 patients", font_size=24),
            Text("48 out of 80 patients improved", font_size=24, color=WHITE),
        ).arrange(DOWN, buff=0.12)
        scenario_lines.next_to(scenario_header, DOWN, buff=0.25)

        for line in scenario_lines:
            self.play(Write(line), run_time=0.5)
            self.wait(0.15)

        self.wait(0.3)

        # Show p-hat calculation
        phat_calc = MathTex(
            r"\hat{p}", r"=", r"\frac{48}{80}", r"=", r"0.60",
            font_size=40,
        )
        phat_calc[0].set_color(TEAL_3B1B)
        phat_calc[4].set_color(TEAL_3B1B)
        phat_calc.next_to(scenario_lines, DOWN, buff=0.3)
        self.play(Write(phat_calc), run_time=0.8)
        self.wait(0.3)

        context_note = Text(
            "If the treatment had NO effect, we'd expect about 50% (p = 0.50)",
            font_size=20, color=GRAY,
        )
        context_note.next_to(phat_calc, DOWN, buff=0.2)
        self.play(Write(context_note), run_time=0.6)
        self.wait(0.5)

        question = Text(
            "Why did we get 60% instead of 50%?",
            font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        question.next_to(context_note, DOWN, buff=0.25)
        self.play(Write(question))
        self.wait(1.0)

        # ========== PART 2: The Fork ==========
        self.play(
            FadeOut(scenario_header), FadeOut(scenario_lines),
            FadeOut(phat_calc), FadeOut(context_note), FadeOut(question),
            run_time=0.5,
        )

        # Result at the top center
        result_box_text = VGroup(
            Text("Observed Result:", font_size=22, color=GRAY),
            MathTex(r"\hat{p} = 0.60", font_size=34, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.08)
        result_box_text.next_to(subtitle, DOWN, buff=0.3)

        result_rect = SurroundingRectangle(
            result_box_text, color=WHITE, buff=0.15, corner_radius=0.1,
        )
        result_group = VGroup(result_rect, result_box_text)

        self.play(FadeIn(result_group))
        self.wait(0.3)

        # Fork: two diagonal lines going left and right
        fork_start = result_group.get_bottom() + DOWN * 0.1
        fork_left_end = fork_start + LEFT * 3 + DOWN * 1.0
        fork_right_end = fork_start + RIGHT * 3 + DOWN * 1.0

        fork_left_line = Line(fork_start, fork_left_end, color=YELLOW_3B1B, stroke_width=3)
        fork_right_line = Line(fork_start, fork_right_end, color=TEAL_3B1B, stroke_width=3)

        self.play(
            Create(fork_left_line),
            Create(fork_right_line),
            run_time=0.8,
        )
        self.wait(0.3)

        # ========== LEFT PATH: CHANCE ==========
        chance_header = Text("CHANCE", font_size=30, color=YELLOW_3B1B, weight=BOLD)
        chance_header.move_to(fork_left_end + DOWN * 0.3)
        self.play(Write(chance_header))
        self.wait(0.2)

        chance_lines = VGroup(
            Text("The result happened by", font_size=20, color=WHITE),
            Text("random chance alone.", font_size=20, color=WHITE),
            Text("", font_size=6),
            Text("The treatment has", font_size=20, color=YELLOW_3B1B),
            Text("NO real effect.", font_size=20, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text("True proportion: p = 0.50", font_size=18, color=GRAY),
            Text("We just got unlucky", font_size=18, color=GRAY),
            Text("in our sample.", font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.06)
        chance_lines.next_to(chance_header, DOWN, buff=0.2)

        chance_box = SurroundingRectangle(
            VGroup(chance_header, chance_lines),
            color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=2,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in chance_lines],
                lag_ratio=0.15,
            ),
            run_time=1.5,
        )
        self.play(Create(chance_box), run_time=0.4)
        self.wait(0.3)

        # ========== RIGHT PATH: REAL EFFECT ==========
        effect_header = Text("REAL EFFECT", font_size=30, color=TEAL_3B1B, weight=BOLD)
        effect_header.move_to(fork_right_end + DOWN * 0.3)
        self.play(Write(effect_header))
        self.wait(0.2)

        effect_lines = VGroup(
            Text("The treatment genuinely", font_size=20, color=WHITE),
            Text("works.", font_size=20, color=WHITE),
            Text("", font_size=6),
            Text("The true proportion", font_size=20, color=TEAL_3B1B),
            Text("p > 0.50.", font_size=20, color=TEAL_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text("The difference is real,", font_size=18, color=GRAY),
            Text("not just sampling", font_size=18, color=GRAY),
            Text("variability.", font_size=18, color=GRAY),
        ).arrange(DOWN, buff=0.06)
        effect_lines.next_to(effect_header, DOWN, buff=0.2)

        effect_box = SurroundingRectangle(
            VGroup(effect_header, effect_lines),
            color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
            stroke_width=2,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in effect_lines],
                lag_ratio=0.15,
            ),
            run_time=1.5,
        )
        self.play(Create(effect_box), run_time=0.4)
        self.wait(0.8)

        # ========== PART 3: "or" label between the two ==========
        or_label = Text("OR", font_size=36, color=PINK_3B1B, weight=BOLD)
        or_label.move_to(
            (chance_header.get_center() + effect_header.get_center()) / 2
        )
        self.play(FadeIn(or_label, scale=1.5))
        self.wait(0.5)

        # ========== PART 4: Statistics decides ==========
        stats_text = Text(
            "Statistics helps us decide WHICH explanation is more believable",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        stats_text.to_edge(DOWN, buff=0.4)
        self.play(Write(stats_text))
        self.wait(1.0)

        # ========== PART 5: Key Insight Box ==========
        self.play(
            FadeOut(result_group), FadeOut(fork_left_line), FadeOut(fork_right_line),
            FadeOut(chance_header), FadeOut(chance_lines), FadeOut(chance_box),
            FadeOut(effect_header), FadeOut(effect_lines), FadeOut(effect_box),
            FadeOut(or_label), FadeOut(stats_text),
            FadeOut(subtitle), FadeOut(title),
            run_time=0.5,
        )

        insight_content = VGroup(
            Text(
                "Two Explanations for Every Result",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),
            Text(
                "Explanation 1: CHANCE",
                font_size=26, color=YELLOW_3B1B,
            ),
            Text(
                "The result happened by random sampling variability.",
                font_size=22,
            ),
            Text(
                "There is no real effect.",
                font_size=22,
            ),
            Text("", font_size=8),
            Text(
                "Explanation 2: REAL EFFECT",
                font_size=26, color=TEAL_3B1B,
            ),
            Text(
                "There is a genuine difference or effect",
                font_size=22,
            ),
            Text(
                "in the population.",
                font_size=22,
            ),
            Text("", font_size=8),
            Text(
                "Statistics tells us which is more believable!",
                font_size=24, color=GREEN_3B1B, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.1)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(2)
