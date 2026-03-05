"""
Identify the Test Procedure (AP Stats Unit 6, Topic 6.4)

Animated decision tree for choosing the right inference procedure:
Goal (Estimate vs Test) -> Data Type (Proportions vs Means) -> Samples (One vs Two)
-> One-sample z-test for a population proportion. Compares z-interval (6.2) vs z-test (6.4).

Run with: manim -qm --format=mp4 apstat_64_identify_test.py IdentifyTestProcedure
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class IdentifyTestProcedure(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Choosing the Right Test", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "A decision-tree approach",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== DECISION TREE ==========
        root = Text("What is the goal?", font_size=24, weight=BOLD)
        root.next_to(title, DOWN, buff=0.4)
        root_box = SurroundingRectangle(root, color=WHITE, buff=0.15, corner_radius=0.08)
        self.play(Write(root), Create(root_box), run_time=0.5)

        # Level 1 branches
        estimate = Text("Estimate\n(CI)", font_size=20, color=GREY_B)
        estimate.move_to(LEFT * 3.5 + UP * 0.1)
        est_box = SurroundingRectangle(estimate, color=GREY_B, buff=0.1, corner_radius=0.08)

        test = Text("Test a\nclaim", font_size=20, color=BLUE_3B1B, weight=BOLD)
        test.move_to(RIGHT * 3.5 + UP * 0.1)
        test_box = SurroundingRectangle(test, color=BLUE_3B1B, buff=0.1, corner_radius=0.08)

        line_est = Line(root_box.get_bottom(), est_box.get_top(), color=GREY_B, stroke_width=2)
        line_test = Line(root_box.get_bottom(), test_box.get_top(), color=BLUE_3B1B, stroke_width=3)

        self.play(
            Create(line_est), Write(estimate), Create(est_box),
            Create(line_test), Write(test), Create(test_box),
            run_time=0.6,
        )
        self.wait(0.4)

        # Level 2: data type
        q2 = Text("What data type?", font_size=20, weight=BOLD)
        q2.move_to(RIGHT * 3.5 + DOWN * 0.9)
        q2_box = SurroundingRectangle(q2, color=WHITE, buff=0.1, corner_radius=0.08)
        line_q2 = Line(test_box.get_bottom(), q2_box.get_top(), color=BLUE_3B1B, stroke_width=3)

        self.play(Create(line_q2), Write(q2), Create(q2_box), run_time=0.5)

        prop = Text("Categorical\n(proportions)", font_size=18, color=BLUE_3B1B, weight=BOLD)
        prop.move_to(RIGHT * 1.5 + DOWN * 1.9)
        prop_box = SurroundingRectangle(prop, color=BLUE_3B1B, buff=0.1, corner_radius=0.08)

        mean = Text("Quantitative\n(means)", font_size=18, color=GREY_B)
        mean.move_to(RIGHT * 5.5 + DOWN * 1.9)
        mean_box = SurroundingRectangle(mean, color=GREY_B, buff=0.1, corner_radius=0.08)

        line_prop = Line(q2_box.get_bottom(), prop_box.get_top(), color=BLUE_3B1B, stroke_width=3)
        line_mean = Line(q2_box.get_bottom(), mean_box.get_top(), color=GREY_B, stroke_width=2)

        self.play(
            Create(line_prop), Write(prop), Create(prop_box),
            Create(line_mean), Write(mean), Create(mean_box),
            run_time=0.6,
        )
        self.wait(0.4)

        # Level 3: how many samples?
        q3 = Text("How many\nsamples?", font_size=18, weight=BOLD)
        q3.move_to(RIGHT * 1.5 + DOWN * 2.9)
        q3_box = SurroundingRectangle(q3, color=WHITE, buff=0.08, corner_radius=0.08)
        line_q3 = Line(prop_box.get_bottom(), q3_box.get_top(), color=BLUE_3B1B, stroke_width=3)

        self.play(Create(line_q3), Write(q3), Create(q3_box), run_time=0.5)

        one_samp = Text("One", font_size=18, color=YELLOW_3B1B, weight=BOLD)
        one_samp.move_to(LEFT * 0.3 + DOWN * 3.6)
        one_box = SurroundingRectangle(one_samp, color=YELLOW_3B1B, buff=0.08, corner_radius=0.08)

        two_samp = Text("Two", font_size=18, color=GREY_B)
        two_samp.move_to(RIGHT * 3.3 + DOWN * 3.6)
        two_box = SurroundingRectangle(two_samp, color=GREY_B, buff=0.08, corner_radius=0.08)

        line_one = Line(q3_box.get_bottom(), one_box.get_top(), color=YELLOW_3B1B, stroke_width=3)
        line_two = Line(q3_box.get_bottom(), two_box.get_top(), color=GREY_B, stroke_width=2)

        self.play(
            Create(line_one), Write(one_samp), Create(one_box),
            Create(line_two), Write(two_samp), Create(two_box),
            run_time=0.6,
        )
        self.wait(0.3)

        # ========== ANSWER ==========
        answer = Text(
            "One-sample z-test\nfor a population proportion",
            font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        answer.move_to(LEFT * 3 + DOWN * 3.2)
        answer_box = SurroundingRectangle(
            answer, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1,
            stroke_width=3,
        )

        arrow_to_answer = Arrow(
            one_box.get_left(), answer_box.get_right(),
            color=YELLOW_3B1B, stroke_width=3,
        )

        self.play(
            Create(arrow_to_answer),
            Write(answer), Create(answer_box),
            run_time=0.6,
        )
        self.wait(0.8)

        # ========== CI vs TEST comparison ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.5,
        )

        comp_title = Text("CI vs. Test: Same Family, Different Goal", font_size=28, weight=BOLD, color=TEAL_3B1B)
        comp_title.next_to(title, DOWN, buff=0.4)
        self.play(Write(comp_title), run_time=0.4)

        ci_header = Text("Topic 6.2", font_size=22, color=BLUE_3B1B, weight=BOLD)
        ci_header.move_to(LEFT * 3 + DOWN * 0.1)
        ci_name = Text(
            "One-sample z-INTERVAL\nfor a population proportion",
            font_size=18, color=BLUE_3B1B,
        )
        ci_name.next_to(ci_header, DOWN, buff=0.15)
        ci_goal = Text("Goal: ESTIMATE p", font_size=18, color=GREY_B)
        ci_goal.next_to(ci_name, DOWN, buff=0.1)

        test_header = Text("Topic 6.4", font_size=22, color=YELLOW_3B1B, weight=BOLD)
        test_header.move_to(RIGHT * 3 + DOWN * 0.1)
        test_name = Text(
            "One-sample z-TEST\nfor a population proportion",
            font_size=18, color=YELLOW_3B1B,
        )
        test_name.next_to(test_header, DOWN, buff=0.15)
        test_goal = Text("Goal: TEST a claim about p", font_size=18, color=GREY_B)
        test_goal.next_to(test_name, DOWN, buff=0.1)

        div = DashedLine(UP * 0.8, DOWN * 1.8, color=GREY_B)

        self.play(
            Write(ci_header), Write(ci_name), Write(ci_goal),
            Write(test_header), Write(test_name), Write(test_goal),
            Create(div),
            run_time=0.8,
        )
        self.wait(0.5)

        key = Text(
            "Same conditions. Same distribution.\nDifferent question.",
            font_size=22, color=GREEN_3B1B,
        )
        key.to_edge(DOWN, buff=0.5)
        key_box = SurroundingRectangle(key, color=GREEN_3B1B, buff=0.2, corner_radius=0.1)
        self.play(Write(key), Create(key_box), run_time=0.5)
        self.wait(1.5)
