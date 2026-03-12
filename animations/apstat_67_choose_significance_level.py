"""
Choose a Significance Level (AP Stats Unit 6, Topic 6.7h)

Teaches students to choose alpha based on the consequences of each
error type.  When Type I error is dangerous, use a smaller alpha.
When Type II error is costly, use a larger alpha.

Run with: manim -qm --format=mp4 apstat_67_choose_significance_level.py ChooseSignificanceLevel
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class ChooseSignificanceLevel(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Choosing a Significance Level", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== DECISION RULE ==========
        rule = Text(
            "Choose \u03b1 based on the consequences of each error type.",
            font_size=22, color=TEAL_3B1B,
        )
        rule.next_to(title, DOWN, buff=0.3)
        self.play(Write(rule), run_time=0.5)
        self.wait(0.5)

        # ========== SCENARIO 1: Type I error is dangerous ==========
        s1_title = Text("Scenario 1: Type I Error Is Dangerous", font_size=22, color=RED_3B1B, weight=BOLD)
        s1_title.next_to(rule, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)

        s1_context = Text(
            "A drug company tests whether a new drug has harmful side effects.",
            font_size=17, color=GREY_B,
        )
        s1_context.next_to(s1_title, DOWN, buff=0.1, aligned_edge=LEFT)

        s1_t1 = Text(
            "Type I: Conclude the drug is safe when it is NOT \u2192 patients harmed",
            font_size=15, color=RED_3B1B,
        )
        s1_t1.next_to(s1_context, DOWN, buff=0.1, aligned_edge=LEFT)

        s1_rec = Text(
            "\u2192 Use \u03b1 = 0.01 (strict) to minimize this dangerous error",
            font_size=16, color=YELLOW_3B1B, weight=BOLD,
        )
        s1_rec.next_to(s1_t1, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(s1_title), run_time=0.4)
        self.play(Write(s1_context), run_time=0.4)
        self.play(Write(s1_t1), run_time=0.4)
        self.play(Write(s1_rec), run_time=0.4)
        self.wait(0.8)

        # ========== SCENARIO 2: Type II error is costly ==========
        s2_title = Text("Scenario 2: Type II Error Is Costly", font_size=22, color=ORANGE_3B1B, weight=BOLD)
        s2_title.next_to(s1_rec, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)

        s2_context = Text(
            "A quality inspector tests whether a production line is defective.",
            font_size=17, color=GREY_B,
        )
        s2_context.next_to(s2_title, DOWN, buff=0.1, aligned_edge=LEFT)

        s2_t2 = Text(
            "Type II: Fail to detect defects \u2192 defective products shipped",
            font_size=15, color=ORANGE_3B1B,
        )
        s2_t2.next_to(s2_context, DOWN, buff=0.1, aligned_edge=LEFT)

        s2_rec = Text(
            "\u2192 Use \u03b1 = 0.10 (lenient) to increase power and catch defects",
            font_size=16, color=YELLOW_3B1B, weight=BOLD,
        )
        s2_rec.next_to(s2_t2, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(s2_title), run_time=0.4)
        self.play(Write(s2_context), run_time=0.4)
        self.play(Write(s2_t2), run_time=0.4)
        self.play(Write(s2_rec), run_time=0.4)
        self.wait(0.8)

        # ========== SUMMARY TABLE ==========
        self.play(*[FadeOut(m) for m in self.mobjects if m is not title], run_time=0.5)

        summary_title = Text("Decision Framework", font_size=28, weight=BOLD, color=TEAL_3B1B)
        summary_title.next_to(title, DOWN, buff=0.4)
        self.play(Write(summary_title), run_time=0.3)

        rows = [
            ("Type I error is worse:", "Use smaller \u03b1 (0.01)", "Fewer false rejections", RED_3B1B),
            ("Type II error is worse:", "Use larger \u03b1 (0.10)", "More power to detect", ORANGE_3B1B),
            ("Both roughly equal:", "Use \u03b1 = 0.05", "Standard balance", TEAL_3B1B),
        ]

        prev = summary_title
        for situation, alpha_choice, effect, color in rows:
            sit_t = Text(situation, font_size=20, color=color, weight=BOLD)
            sit_t.next_to(prev, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
            choice_t = Text(alpha_choice, font_size=18, color=YELLOW_3B1B)
            choice_t.next_to(sit_t, RIGHT, buff=0.3)
            eff_t = Text(effect, font_size=16, color=GREY_B)
            eff_t.next_to(sit_t, DOWN, buff=0.06, aligned_edge=LEFT)
            self.play(Write(sit_t), Write(choice_t), run_time=0.4)
            self.play(Write(eff_t), run_time=0.25)
            prev = eff_t

        closing = Text(
            "There is no single correct \u03b1 \u2014 it depends on the context.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.5)
        closing_box = SurroundingRectangle(closing, color=YELLOW_3B1B, buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
