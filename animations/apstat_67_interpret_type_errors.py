"""
Interpret Type I and Type II Errors in Context (AP Stats Unit 6, Topic 6.7)

Uses a real-world drug-testing scenario to show how to describe
Type I and Type II errors in context. Emphasizes the AP Exam pattern:
"We conclude ... but in reality ..." for each error type.

Run with: manim -qm --format=mp4 apstat_67_interpret_type_errors.py InterpretTypeErrors
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class InterpretTypeErrors(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Interpreting Errors in Context", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== SCENARIO ==========
        scenario_label = Text("Scenario:", font_size=26, color=TEAL_3B1B, weight=BOLD)
        scenario_label.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)

        scenario = Text(
            "A company claims 90% of its packages arrive on time.\n"
            "A consumer group suspects it is less than 90%.",
            font_size=20, color=WHITE,
        )
        scenario.next_to(scenario_label, DOWN, buff=0.15, aligned_edge=LEFT)

        hyp_line = Text(
            "H\u2080: p = 0.90    H\u2090: p < 0.90",
            font_size=24, color=YELLOW_3B1B, weight=BOLD,
        )
        hyp_line.next_to(scenario, DOWN, buff=0.25)

        self.play(Write(scenario_label), run_time=0.3)
        self.play(Write(scenario), run_time=0.6)
        self.play(Write(hyp_line), run_time=0.5)
        self.wait(0.8)

        # ========== TYPE I ERROR ==========
        self.play(
            FadeOut(scenario_label), FadeOut(scenario),
            hyp_line.animate.next_to(title, DOWN, buff=0.2).scale(0.85),
            run_time=0.4,
        )

        t1_header = Text("Type I Error", font_size=32, color=RED_3B1B, weight=BOLD)
        t1_header.next_to(hyp_line, DOWN, buff=0.4).align_to(LEFT * 4.5, LEFT)

        t1_def = Text(
            "Reject H\u2080 when H\u2080 is actually true",
            font_size=20, color=GREY_B,
        )
        t1_def.next_to(t1_header, DOWN, buff=0.12, aligned_edge=LEFT)

        self.play(Write(t1_header), run_time=0.4)
        self.play(Write(t1_def), run_time=0.4)
        self.wait(0.3)

        # In-context interpretation
        t1_context = Text(
            "In context:",
            font_size=20, color=YELLOW_3B1B, weight=BOLD,
        )
        t1_context.next_to(t1_def, DOWN, buff=0.25, aligned_edge=LEFT)

        t1_interp = Text(
            'The consumer group concludes that less\n'
            'than 90% of packages arrive on time,\n'
            'but in reality 90% DO arrive on time.',
            font_size=20, color=RED_3B1B,
        )
        t1_interp.next_to(t1_context, DOWN, buff=0.1, aligned_edge=LEFT)

        t1_box = SurroundingRectangle(t1_interp, color=RED_3B1B, buff=0.15, corner_radius=0.1)

        self.play(Write(t1_context), run_time=0.3)
        self.play(Write(t1_interp), Create(t1_box), run_time=0.7)
        self.wait(1.0)

        # ========== TYPE II ERROR ==========
        t2_header = Text("Type II Error", font_size=32, color=ORANGE_3B1B, weight=BOLD)
        t2_header.next_to(t1_box, DOWN, buff=0.35).align_to(t1_header, LEFT)

        t2_def = Text(
            "Fail to reject H\u2080 when H\u2080 is actually false",
            font_size=20, color=GREY_B,
        )
        t2_def.next_to(t2_header, DOWN, buff=0.12, aligned_edge=LEFT)

        self.play(Write(t2_header), run_time=0.4)
        self.play(Write(t2_def), run_time=0.4)
        self.wait(0.3)

        t2_context = Text(
            "In context:",
            font_size=20, color=YELLOW_3B1B, weight=BOLD,
        )
        t2_context.next_to(t2_def, DOWN, buff=0.25, aligned_edge=LEFT)

        t2_interp = Text(
            'The consumer group does NOT find evidence\n'
            'that less than 90% arrive on time,\n'
            'but in reality FEWER than 90% do.',
            font_size=20, color=ORANGE_3B1B,
        )
        t2_interp.next_to(t2_context, DOWN, buff=0.1, aligned_edge=LEFT)

        t2_box = SurroundingRectangle(t2_interp, color=ORANGE_3B1B, buff=0.15, corner_radius=0.1)

        self.play(Write(t2_context), run_time=0.3)
        self.play(Write(t2_interp), Create(t2_box), run_time=0.7)
        self.wait(1.0)

        # ========== AP EXAM TEMPLATE ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.5,
        )

        template_title = Text(
            "AP Exam Template", font_size=30, weight=BOLD, color=TEAL_3B1B,
        )
        template_title.next_to(title, DOWN, buff=0.4)

        t1_tmpl_label = Text("Type I:", font_size=22, color=RED_3B1B, weight=BOLD)
        t1_tmpl_label.next_to(template_title, DOWN, buff=0.35).align_to(LEFT * 4.5, LEFT)

        t1_tmpl = Text(
            '"We conclude [H\u2090 in context],\n but in reality [H\u2080 in context]."',
            font_size=20, color=WHITE,
        )
        t1_tmpl.next_to(t1_tmpl_label, DOWN, buff=0.1, aligned_edge=LEFT)

        t2_tmpl_label = Text("Type II:", font_size=22, color=ORANGE_3B1B, weight=BOLD)
        t2_tmpl_label.next_to(t1_tmpl, DOWN, buff=0.3).align_to(t1_tmpl_label, LEFT)

        t2_tmpl = Text(
            '"We do not find evidence that [H\u2090 in context],\n but in reality [H\u2090 is true]."',
            font_size=20, color=WHITE,
        )
        t2_tmpl.next_to(t2_tmpl_label, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(template_title), run_time=0.4)
        self.play(Write(t1_tmpl_label), Write(t1_tmpl), run_time=0.6)
        self.play(Write(t2_tmpl_label), Write(t2_tmpl), run_time=0.6)
        self.wait(0.5)

        # Key takeaway
        key = Text(
            "Always describe both errors using the CONTEXT of the problem!",
            font_size=20, color=YELLOW_3B1B,
        )
        key.to_edge(DOWN, buff=0.5)
        key_box = SurroundingRectangle(key, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1)
        self.play(Write(key), Create(key_box), run_time=0.5)
        self.wait(1.5)
