"""
Write Both Hypotheses (AP Stats Unit 6, Topic 6.4)

Walks through a complete example of writing H0 and Ha step by step:
1. Read the scenario (lemonade/green cup)
2. Define the parameter p (highlight "ALL" for population language)
3. Write H0: p = 0.50
4. Find the keyword -> write Ha: p > 0.50
Shows common error (using p-hat) vs correct form (using p).

Run with: manim -qm --format=mp4 apstat_64_write_both.py WriteBothHypotheses
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"


class WriteBothHypotheses(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Writing Hypotheses: Step by Step", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== STEP 1: SCENARIO ==========
        step1_label = Text("Step 1: Read the scenario", font_size=22, color=TEAL_3B1B, weight=BOLD)
        step1_label.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        self.play(Write(step1_label), run_time=0.4)

        scenario = Text(
            "Researchers wonder if students associate green\n"
            "with being more natural. If so, more than 50%\n"
            "would choose the green cup.",
            font_size=20, line_spacing=1.3,
        )
        scenario.next_to(step1_label, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(scenario), run_time=0.8)
        self.wait(0.6)

        # ========== STEP 2: DEFINE PARAMETER ==========
        step2_label = Text("Step 2: Define the parameter", font_size=22, color=TEAL_3B1B, weight=BOLD)
        step2_label.next_to(scenario, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(step2_label), run_time=0.4)

        param_text = Text(
            "p = the proportion of ALL students at\n"
            "the school who would choose the green cup",
            font_size=20, line_spacing=1.3,
        )
        param_text.next_to(step2_label, DOWN, buff=0.15, aligned_edge=LEFT)

        self.play(Write(param_text), run_time=0.6)

        pop_arrow = Text(
            '<-- "ALL" = population, not sample!',
            font_size=16, color=GREEN_3B1B,
        )
        pop_arrow.next_to(param_text, RIGHT, buff=0.2).shift(UP * 0.15)
        self.play(Write(pop_arrow), run_time=0.4)
        self.wait(0.5)

        # ========== STEP 3: WRITE H0 ==========
        top_content = VGroup(step1_label, scenario, step2_label, param_text, pop_arrow)
        self.play(
            top_content.animate.scale(0.55).to_corner(UL, buff=0.5).shift(DOWN * 0.3),
            run_time=0.5,
        )

        step3_label = Text("Step 3: Write the null hypothesis", font_size=24, color=TEAL_3B1B, weight=BOLD)
        step3_label.move_to(UP * 1.0).align_to(LEFT * 3, LEFT)
        self.play(Write(step3_label), run_time=0.4)

        h0_text = Text(
            "H\u2080: p = 0.50", font_size=40, weight=BOLD,
        )
        h0_text[:3].set_color(BLUE_3B1B)
        h0_text[4].set_color(YELLOW_3B1B)
        h0_text.next_to(step3_label, DOWN, buff=0.2, aligned_edge=LEFT)
        self.play(Write(h0_text), run_time=0.6)

        h0_note = Text(
            '50% = "no preference" (no difference from chance)',
            font_size=18, color=GREY_B,
        )
        h0_note.next_to(h0_text, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(h0_note), run_time=0.4)
        self.wait(0.4)

        # ========== STEP 4: WRITE Ha ==========
        step4_label = Text("Step 4: Write the alternative hypothesis", font_size=24, color=TEAL_3B1B, weight=BOLD)
        step4_label.next_to(h0_note, DOWN, buff=0.35, aligned_edge=LEFT)
        self.play(Write(step4_label), run_time=0.4)

        keyword_note = Text(
            'Keyword: "more than" 50%  -->  p > 0.50',
            font_size=20, color=YELLOW_3B1B,
        )
        keyword_note.next_to(step4_label, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(keyword_note), run_time=0.5)

        ha_text = Text(
            "H\u2090: p > 0.50", font_size=40, weight=BOLD,
        )
        ha_text[:3].set_color(BLUE_3B1B)
        ha_text[4].set_color(YELLOW_3B1B)
        ha_text.next_to(keyword_note, DOWN, buff=0.2, aligned_edge=LEFT)
        self.play(Write(ha_text), run_time=0.6)
        self.wait(0.5)

        # ========== COMMON ERROR VS CORRECT ==========
        self.play(
            FadeOut(VGroup(
                step3_label, h0_text, h0_note, step4_label, keyword_note, ha_text,
                top_content,
            )),
            run_time=0.5,
        )

        error_title = Text("Common Error", font_size=28, weight=BOLD, color=RED_3B1B)
        error_title.move_to(LEFT * 3 + UP * 0.8)

        wrong = Text(
            "H\u2080: p\u0302 = 0.50",
            font_size=36, color=RED_3B1B, weight=BOLD,
        )
        wrong.next_to(error_title, DOWN, buff=0.2)

        x_mark = Text("X", font_size=60, color=RED_3B1B, weight=BOLD)
        x_mark.move_to(wrong.get_center())

        correct_title = Text("Correct", font_size=28, weight=BOLD, color=GREEN_3B1B)
        correct_title.move_to(RIGHT * 3 + UP * 0.8)

        right = Text(
            "H\u2080: p = 0.50",
            font_size=36, color=GREEN_3B1B, weight=BOLD,
        )
        right.next_to(correct_title, DOWN, buff=0.2)

        check_mark = Text("OK", font_size=36, color=GREEN_3B1B, weight=BOLD)
        check_mark.move_to(right.get_center() + RIGHT * 1.5)

        div_line = DashedLine(UP * 1.5, DOWN * 1.5, color=GREY_B)

        self.play(
            Write(error_title), Write(wrong),
            Write(correct_title), Write(right),
            Create(div_line),
            run_time=0.6,
        )
        self.play(Write(x_mark), run_time=0.3)
        self.play(Write(check_mark), run_time=0.3)
        self.wait(0.5)

        explain = Text(
            "Hypotheses are about the POPULATION (p),\nnever the sample (p\u0302).",
            font_size=22, color=YELLOW_3B1B,
        )
        explain.to_edge(DOWN, buff=0.5)
        explain_box = SurroundingRectangle(
            explain, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Write(explain), Create(explain_box), run_time=0.6)
        self.wait(1.5)
