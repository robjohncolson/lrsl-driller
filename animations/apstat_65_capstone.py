"""
Capstone: From Hypotheses to p-Value Interpretation (AP Stats Unit 6, Topic 6.5)

Animated flowchart showing the complete process for performing a significance
test through p-value interpretation: State hypotheses -> Calculate test statistic
-> Find p-value -> Interpret p-value. Each step gets a checkmark.
Connects to Topic 6.6 (making a conclusion).

Run with: manim -qm --format=mp4 apstat_65_capstone.py CapstonePValueInterpretation
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class CapstonePValueInterpretation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Significance Test: The Full Process", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.2)

        subtitle = Text(
            "From Hypotheses to p-Value Interpretation",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.1)
        self.play(Write(subtitle))
        self.wait(0.3)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== STEP BOXES ==========
        steps_data = [
            ("1", "HYPOTHESES", "H\u2080: p = p\u2080   H\u2090: p [<, >, or \u2260] p\u2080\nDefine p in context"),
            ("2", "CONDITIONS", "Random, 10%, Large Counts\n(use p\u2080 for large counts!)"),
            ("3", "TEST STATISTIC", "z = (p\u0302 \u2212 p\u2080) / \u221a(p\u2080(1\u2212p\u2080)/n)\nUse p\u2080 in the denominator"),
            ("4", "p-VALUE", "Match tail to H\u2090:\n> right  |  < left  |  \u2260 both"),
            ("5", "INTERPRET", "Assuming H\u2080 true, probability of\np\u0302 this extreme by chance alone"),
        ]

        step_groups = []
        colors = [TEAL_3B1B, YELLOW_3B1B, BLUE_3B1B, ORANGE_3B1B, GREEN_3B1B]

        for i, (num, label, desc) in enumerate(steps_data):
            num_text = Text(num, font_size=22, weight=BOLD, color=colors[i])
            label_text = Text(label, font_size=20, weight=BOLD, color=colors[i])
            desc_text = Text(desc, font_size=14, color=WHITE, line_spacing=1.2)

            header = VGroup(num_text, label_text).arrange(RIGHT, buff=0.15)
            content = VGroup(header, desc_text).arrange(DOWN, buff=0.06, aligned_edge=LEFT)

            box = SurroundingRectangle(
                content, color=ManimColor(colors[i]), buff=0.1, corner_radius=0.08,
            )
            group = VGroup(box, content)
            step_groups.append(group)

        all_steps = VGroup(*step_groups)
        all_steps.arrange(DOWN, buff=0.12)
        all_steps.next_to(title, DOWN, buff=0.25)

        if all_steps.height > 5.5:
            all_steps.scale_to_fit_height(5.5)

        arrows = []
        for i, group in enumerate(step_groups):
            self.play(FadeIn(group, shift=RIGHT * 0.5), run_time=0.35)

            if i < len(step_groups) - 1:
                arrow = Arrow(
                    group.get_bottom(),
                    step_groups[i + 1].get_top(),
                    color=GREY_B, stroke_width=2,
                    buff=0.04,
                )
                arrows.append(arrow)

            self.wait(0.15)

        if arrows:
            self.play(*[Create(a) for a in arrows], run_time=0.4)
        self.wait(0.5)

        # ========== ADD CHECKMARKS ==========
        checks = []
        for group in step_groups:
            check = Text("OK", font_size=16, color=GREEN_3B1B, weight=BOLD)
            check.next_to(group, RIGHT, buff=0.12)
            checks.append(check)

        for check in checks:
            self.play(Write(check), run_time=0.15)
        self.wait(0.5)

        # ========== WORKED EXAMPLE FLASH ==========
        self.play(
            *[FadeOut(c) for c in checks],
            run_time=0.3,
        )

        # Highlight step 3 and 4 with example values
        ex_values = Text(
            "Example: p\u0302 = 0.29, p\u2080 = 0.40, n = 100\n"
            "z = \u22122.25, p-value = 0.0244",
            font_size=18, color=YELLOW_3B1B,
        )
        ex_values.next_to(all_steps, RIGHT, buff=0.2)

        if ex_values.get_right()[0] > 6.5:
            ex_values.scale(0.85)

        self.play(Write(ex_values), run_time=0.6)
        self.wait(0.5)

        # ========== CLOSING ==========
        self.play(FadeOut(ex_values), run_time=0.3)

        closing = Text(
            "Process complete! Next: make a conclusion\n"
            "about the hypotheses (Topic 6.6)",
            font_size=18, color=TEAL_3B1B,
        )
        closing.to_edge(DOWN, buff=0.3)
        closing_box = SurroundingRectangle(
            closing, color=TEAL_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
