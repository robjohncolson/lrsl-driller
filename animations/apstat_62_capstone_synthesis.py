"""
Complete CI Workflow: Capstone Synthesis (AP Stats Unit 6, Topic 6.2)

Full confidence interval workflow from start to finish, presented as a
step-by-step pipeline: Identify -> Check Conditions -> Calculate -> Interpret.
Each step is shown as a colored box that builds into a flowchart. A quick
worked example (120/200 students prefer morning classes, 90% confidence)
flows through all 4 steps. Ends with the "4 Steps" summary box.

Run with: manim -qm --format=mp4 apstat_62_capstone_synthesis.py CapstoneSynthesis
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CapstoneSynthesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Complete CI Workflow", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # ================================================================
        # HELPER: make a rounded box node
        # ================================================================
        def make_node(text, color, width=3.5, height=0.7, font_size=24):
            box = RoundedRectangle(
                corner_radius=0.15,
                width=width,
                height=height,
                stroke_color=color,
                stroke_width=2.5,
                fill_color=color,
                fill_opacity=0.12,
            )
            label = Text(text, font_size=font_size, color=color, weight=BOLD)
            label.move_to(box.get_center())
            return VGroup(box, label)

        # ================================================================
        # BUILD THE 4-STEP PIPELINE
        # ================================================================
        step_header = Text(
            "The 4-Step Process", font_size=28, color=TEAL_3B1B, weight=BOLD,
        )
        step_header.next_to(title, DOWN, buff=0.3)
        self.play(Write(step_header), run_time=0.5)

        # Step 1: Identify
        node1 = make_node("1. Identify", BLUE_3B1B)
        node1.move_to(LEFT * 4.5 + DOWN * 0.3)

        desc1 = Text(
            "One-sample\nz-interval for p",
            font_size=18, color=BLUE_3B1B,
        )
        desc1.next_to(node1, DOWN, buff=0.12)

        self.play(FadeIn(node1), run_time=0.5)
        self.play(Write(desc1), run_time=0.5)
        self.wait(0.3)

        # Arrow 1->2
        arrow1 = Arrow(
            node1[0].get_right(), node1[0].get_right() + RIGHT * 1.0,
            color=WHITE, buff=0.1, stroke_width=2.5, tip_length=0.15,
        )

        # Step 2: Conditions
        node2 = make_node("2. Conditions", GREEN_3B1B, width=3.5, height=0.7)
        node2.next_to(arrow1, RIGHT, buff=0.1)

        desc2_lines = VGroup(
            Text("Random?", font_size=16, color=GREEN_3B1B),
            Text("10% condition?", font_size=16, color=GREEN_3B1B),
            Text("Large Counts?", font_size=16, color=GREEN_3B1B),
        ).arrange(DOWN, buff=0.04, aligned_edge=LEFT)
        desc2_lines.next_to(node2, DOWN, buff=0.12)

        self.play(Create(arrow1), run_time=0.3)
        self.play(FadeIn(node2), run_time=0.5)
        self.play(Write(desc2_lines), run_time=0.6)
        self.wait(0.3)

        # Arrow 2->3
        arrow2 = Arrow(
            node2[0].get_right(), node2[0].get_right() + RIGHT * 1.0,
            color=WHITE, buff=0.1, stroke_width=2.5, tip_length=0.15,
        )

        # Step 3: Calculate
        node3 = make_node("3. Calculate", TEAL_3B1B, width=3.5, height=0.7)
        node3.next_to(arrow2, RIGHT, buff=0.1)

        desc3_lines = VGroup(
            MathTex(r"\text{SE}, \; z^*, \; \text{ME}", font_size=20, color=TEAL_3B1B),
            MathTex(r"(\hat{p} - \text{ME}, \; \hat{p} + \text{ME})", font_size=20, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.04)
        desc3_lines.next_to(node3, DOWN, buff=0.12)

        self.play(Create(arrow2), run_time=0.3)
        self.play(FadeIn(node3), run_time=0.5)
        self.play(Write(desc3_lines), run_time=0.6)
        self.wait(0.3)

        # Step 4: Interpret goes below as a full-width node
        arrow3_down = Arrow(
            node3[0].get_bottom() + DOWN * 0.05,
            node3[0].get_bottom() + DOWN * 0.7,
            color=WHITE, buff=0.05, stroke_width=2.5, tip_length=0.15,
        )

        node4 = make_node("4. Interpret", YELLOW_3B1B, width=10, height=0.7)
        node4.next_to(arrow3_down, DOWN, buff=0.05)

        desc4 = Text(
            "\"We are __% confident that the interval from ___ to ___ captures the true proportion of [context].\"",
            font_size=17, color=YELLOW_3B1B,
        )
        desc4.next_to(node4, DOWN, buff=0.12)

        self.play(Create(arrow3_down), run_time=0.3)
        self.play(FadeIn(node4), run_time=0.5)
        self.play(Write(desc4), run_time=0.7)
        self.wait(1.0)

        # ================================================================
        # TRANSITION: Shrink pipeline, show worked example
        # ================================================================
        pipeline = VGroup(
            step_header,
            node1, desc1, arrow1,
            node2, desc2_lines, arrow2,
            node3, desc3_lines,
            arrow3_down, node4, desc4,
        )
        self.play(
            pipeline.animate.scale(0.4).to_corner(UL, buff=0.3).shift(DOWN * 0.3),
            run_time=0.6,
        )

        # ================================================================
        # WORKED EXAMPLE
        # ================================================================
        ex_title = Text(
            "Worked Example", font_size=32, color=YELLOW_3B1B, weight=BOLD,
        )
        ex_title.to_edge(UP, buff=0.3).shift(RIGHT * 1.5)
        self.play(FadeOut(title), Write(ex_title), run_time=0.5)

        scenario = Text(
            "120 out of 200 students prefer morning classes.  (90% confidence)",
            font_size=24,
        )
        scenario.next_to(ex_title, DOWN, buff=0.25)
        self.play(Write(scenario), run_time=0.7)
        self.wait(0.3)

        phat_line = MathTex(
            r"\hat{p} = \frac{120}{200} = 0.60", font_size=30, color=TEAL_3B1B,
        )
        phat_line.next_to(scenario, DOWN, buff=0.2)
        self.play(Write(phat_line), run_time=0.5)
        self.wait(0.3)

        # ---- Step 1: Identify ----
        id_box = make_node("Step 1: Identify", BLUE_3B1B, width=4.5, height=0.55, font_size=22)
        id_box.next_to(phat_line, DOWN, buff=0.3)
        id_box.to_edge(LEFT, buff=1.0)

        id_text = Text(
            "One-sample z-interval for p",
            font_size=22, color=BLUE_3B1B,
        )
        id_text.next_to(id_box, RIGHT, buff=0.3)

        self.play(FadeIn(id_box), Write(id_text), run_time=0.5)
        self.wait(0.3)

        # ---- Step 2: Conditions ----
        cond_box = make_node("Step 2: Conditions", GREEN_3B1B, width=4.5, height=0.55, font_size=22)
        cond_box.next_to(id_box, DOWN, buff=0.25)
        cond_box.align_to(id_box, LEFT)

        cond_checks = VGroup(
            Text("Random? Assumed random sample", font_size=18),
            Text("10%: 200 < 10% of 5000 population", font_size=18),
            Text("Large Counts: 120 >= 10  and  80 >= 10", font_size=18),
        ).arrange(DOWN, buff=0.04, aligned_edge=LEFT)
        cond_checks.next_to(cond_box, RIGHT, buff=0.3)

        # Add check marks
        checks = VGroup()
        for line in cond_checks:
            check = Text("ok", font_size=16, color=GREEN_3B1B, weight=BOLD)
            check.next_to(line, RIGHT, buff=0.15)
            checks.add(check)

        self.play(FadeIn(cond_box), run_time=0.3)
        self.play(
            LaggedStart(
                *[Write(line) for line in cond_checks],
                lag_ratio=0.2,
            ),
            run_time=0.9,
        )
        self.play(
            LaggedStart(*[FadeIn(c) for c in checks], lag_ratio=0.15),
            run_time=0.5,
        )
        self.wait(0.3)

        # ---- Step 3: Calculate ----
        calc_box = make_node("Step 3: Calculate", TEAL_3B1B, width=4.5, height=0.55, font_size=22)
        calc_box.next_to(cond_box, DOWN, buff=0.25)
        calc_box.align_to(id_box, LEFT)

        calc_lines = VGroup(
            MathTex(
                r"\text{SE} = \sqrt{\frac{0.60 \times 0.40}{200}} = 0.0346",
                font_size=26,
            ),
            MathTex(r"z^* = 1.645", font_size=26, color=PINK_3B1B),
            MathTex(
                r"\text{ME} = 1.645 \times 0.0346 = 0.0569",
                font_size=26, color=YELLOW_3B1B,
            ),
            MathTex(
                r"\text{CI} = (0.60 - 0.057, \; 0.60 + 0.057) = (0.543, \; 0.657)",
                font_size=26, color=GREEN_3B1B,
            ),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT)
        calc_lines.next_to(calc_box, RIGHT, buff=0.3)

        self.play(FadeIn(calc_box), run_time=0.3)
        self.play(
            LaggedStart(
                *[Write(line) for line in calc_lines],
                lag_ratio=0.3,
            ),
            run_time=1.8,
        )
        self.wait(0.5)

        # ---- Step 4: Interpret ----
        # Need more room — fade upper steps
        upper_work = VGroup(
            scenario, phat_line,
            id_box, id_text,
            cond_box, cond_checks, checks,
            calc_box, calc_lines,
        )
        self.play(upper_work.animate.scale(0.5).to_corner(UR, buff=0.2).shift(DOWN * 0.3), run_time=0.5)

        interp_box = make_node("Step 4: Interpret", YELLOW_3B1B, width=4.5, height=0.55, font_size=22)
        interp_box.move_to(LEFT * 2 + DOWN * 0.5)

        interp_text = VGroup(
            Text(
                "We are 90% confident that the interval",
                font_size=24,
            ),
            Text(
                "from 0.543 to 0.657",
                font_size=26, color=GREEN_3B1B, weight=BOLD,
            ),
            Text(
                "captures the true proportion of students",
                font_size=24,
            ),
            Text(
                "who prefer morning classes.",
                font_size=24,
            ),
        ).arrange(DOWN, buff=0.08)
        interp_text.next_to(interp_box, DOWN, buff=0.25)

        self.play(FadeIn(interp_box), run_time=0.4)
        self.play(
            LaggedStart(
                *[Write(line) for line in interp_text],
                lag_ratio=0.3,
            ),
            run_time=1.8,
        )
        self.wait(0.3)

        interp_surround = SurroundingRectangle(
            interp_text, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(interp_surround), run_time=0.4)
        self.wait(1.0)

        # ================================================================
        # FINAL SUMMARY
        # ================================================================
        self.play(
            FadeOut(upper_work), FadeOut(pipeline),
            FadeOut(interp_box), FadeOut(interp_text), FadeOut(interp_surround),
            FadeOut(ex_title),
            run_time=0.5,
        )

        # Rebuild the 4 steps as a clean horizontal flow
        final_header = Text(
            "4 Steps: The Complete CI Process",
            font_size=34, color=WHITE, weight=BOLD,
        )
        final_header.to_edge(UP, buff=0.5)
        self.play(Write(final_header), run_time=0.6)

        # Four nodes in a row
        fn1 = make_node("Identify", BLUE_3B1B, width=2.4, height=0.65, font_size=22)
        fn2 = make_node("Conditions", GREEN_3B1B, width=2.4, height=0.65, font_size=22)
        fn3 = make_node("Calculate", TEAL_3B1B, width=2.4, height=0.65, font_size=22)
        fn4 = make_node("Interpret", YELLOW_3B1B, width=2.4, height=0.65, font_size=22)

        nodes_row = VGroup(fn1, fn2, fn3, fn4).arrange(RIGHT, buff=0.6)
        nodes_row.move_to(UP * 0.5)

        # Arrows between nodes
        fa1 = Arrow(
            fn1[0].get_right(), fn2[0].get_left(),
            color=WHITE, buff=0.05, stroke_width=2.5, tip_length=0.15,
        )
        fa2 = Arrow(
            fn2[0].get_right(), fn3[0].get_left(),
            color=WHITE, buff=0.05, stroke_width=2.5, tip_length=0.15,
        )
        fa3 = Arrow(
            fn3[0].get_right(), fn4[0].get_left(),
            color=WHITE, buff=0.05, stroke_width=2.5, tip_length=0.15,
        )

        self.play(
            LaggedStart(
                FadeIn(fn1), Create(fa1),
                FadeIn(fn2), Create(fa2),
                FadeIn(fn3), Create(fa3),
                FadeIn(fn4),
                lag_ratio=0.15,
            ),
            run_time=1.5,
        )
        self.wait(0.3)

        # Brief descriptions under each
        fd1 = Text("z-interval\nfor p", font_size=16, color=BLUE_3B1B)
        fd1.next_to(fn1, DOWN, buff=0.12)
        fd2 = Text("Random, 10%,\nLarge Counts", font_size=16, color=GREEN_3B1B)
        fd2.next_to(fn2, DOWN, buff=0.12)
        fd3 = Text("SE, z*, ME,\nInterval", font_size=16, color=TEAL_3B1B)
        fd3.next_to(fn3, DOWN, buff=0.12)
        fd4 = Text("\"We are __%\nconfident...\"", font_size=16, color=YELLOW_3B1B)
        fd4.next_to(fn4, DOWN, buff=0.12)

        self.play(
            Write(fd1), Write(fd2), Write(fd3), Write(fd4),
            run_time=0.8,
        )
        self.wait(0.5)

        # Key formula beneath
        key_formula = MathTex(
            r"\hat{p} \pm z^* \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=40,
        )
        key_formula.next_to(VGroup(fd1, fd2, fd3, fd4), DOWN, buff=0.45)

        self.play(Write(key_formula), run_time=0.8)
        self.wait(0.3)

        # Big surrounding box
        final_content = VGroup(
            final_header, nodes_row, fa1, fa2, fa3,
            fd1, fd2, fd3, fd4, key_formula,
        )
        final_box = SurroundingRectangle(
            final_content, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )
        self.play(Create(final_box), run_time=0.5)
        self.wait(2.5)
