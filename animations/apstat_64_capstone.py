"""
Capstone: Full Significance Test Setup (AP Stats Unit 6, Topic 6.4)

Animated flowchart showing the complete process for setting up a significance
test: Read scenario -> Define parameter -> Write hypotheses -> Name procedure
-> Check conditions. Each step gets a checkmark. Ties to next topics (6.5-6.6).

Run with: manim -qm --format=mp4 apstat_64_capstone.py CapstoneFullSetup
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class CapstoneFullSetup(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Setting Up a Significance Test", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.2)

        subtitle = Text(
            "The Complete Process", font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.1)
        self.play(Write(subtitle))
        self.wait(0.3)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== STEP BOXES ==========
        steps_data = [
            ("1", "READ", "Identify the research question"),
            ("2", "DEFINE", "p = proportion of ALL [population]\nwho would [action]"),
            ("3", "HYPOTHESIZE", "H\u2080: p = p\u2080\nH\u2090: p [<, >, or \u2260] p\u2080"),
            ("4", "NAME", "One-sample z-test for p"),
            ("5", "CHECK", "Random, 10%, Large Counts\n(using p\u2080, not p\u0302)"),
        ]

        step_groups = []
        colors = [TEAL_3B1B, YELLOW_3B1B, BLUE_3B1B, ORANGE_3B1B, GREEN_3B1B]

        for i, (num, label, desc) in enumerate(steps_data):
            num_text = Text(num, font_size=24, weight=BOLD, color=colors[i])
            label_text = Text(label, font_size=22, weight=BOLD, color=colors[i])
            desc_text = Text(desc, font_size=16, color=WHITE, line_spacing=1.2)

            header = VGroup(num_text, label_text).arrange(RIGHT, buff=0.15)
            content = VGroup(header, desc_text).arrange(DOWN, buff=0.08, aligned_edge=LEFT)

            box = SurroundingRectangle(
                content, color=ManimColor(colors[i]), buff=0.12, corner_radius=0.08,
            )
            group = VGroup(box, content)
            step_groups.append(group)

        all_steps = VGroup(*step_groups)
        all_steps.arrange(DOWN, buff=0.15)
        all_steps.next_to(title, DOWN, buff=0.3)

        if all_steps.height > 5.5:
            all_steps.scale_to_fit_height(5.5)

        arrows = []
        for i, group in enumerate(step_groups):
            self.play(FadeIn(group, shift=RIGHT * 0.5), run_time=0.4)

            if i < len(step_groups) - 1:
                arrow = Arrow(
                    group.get_bottom(),
                    step_groups[i + 1].get_top(),
                    color=GREY_B, stroke_width=2,
                    buff=0.05,
                )
                arrows.append(arrow)

            self.wait(0.2)

        if arrows:
            self.play(*[Create(a) for a in arrows], run_time=0.4)
        self.wait(0.5)

        # ========== ADD CHECKMARKS ==========
        checks = []
        for group in step_groups:
            check = Text("OK", font_size=18, color=GREEN_3B1B, weight=BOLD)
            check.next_to(group, RIGHT, buff=0.15)
            checks.append(check)

        for check in checks:
            self.play(Write(check), run_time=0.2)
        self.wait(0.5)

        # ========== CLOSING ==========
        closing = Text(
            "Setup complete! Next: calculate the test\n"
            "statistic and p-value (Topics 6.5\u20136.6)",
            font_size=20, color=TEAL_3B1B,
        )
        closing.to_edge(DOWN, buff=0.3)
        closing_box = SurroundingRectangle(
            closing, color=TEAL_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Write(closing), Create(closing_box), run_time=0.6)
        self.wait(1.5)
