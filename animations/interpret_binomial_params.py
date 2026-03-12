"""
Interpret Binomial Parameters (AP Stats Unit 4, Topic 4.11c)

Shows how to interpret mu and sigma in the context of a real problem.

Run with: manim -qm --format=mp4 interpret_binomial_params.py InterpretBinomialParams
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class InterpretBinomialParams(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret Binomial Parameters", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== CONTEXT ==========
        context = Text(
            "A polling company calls 200 random households. Historically 40% answer.",
            font_size=19, color=GREY_B,
        )
        context.next_to(title, DOWN, buff=0.3)
        self.play(Write(context), run_time=0.4)

        params = Text("n = 200, p = 0.40", font_size=22, color=ManimColor(BLUE_3B1B), weight=BOLD)
        params.next_to(context, DOWN, buff=0.2)
        self.play(Write(params), run_time=0.3)
        self.wait(0.3)

        # ========== MEAN ==========
        mean_label = Text("Mean:", font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD)
        mean_label.next_to(params, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        mean_calc = MathTex(r"\mu = 200(0.40) = 80", font_size=26)
        mean_calc.next_to(mean_label, RIGHT, buff=0.3)
        mean_interp = Text(
            "\"On average, 80 households will answer out of 200.\"",
            font_size=17, color=ManimColor(GREEN_3B1B),
        )
        mean_interp.next_to(mean_label, DOWN, buff=0.12, aligned_edge=LEFT)
        self.play(Write(mean_label), Write(mean_calc), run_time=0.4)
        self.play(Write(mean_interp), run_time=0.3)
        self.wait(0.3)

        # ========== SD ==========
        sd_label = Text("Standard Deviation:", font_size=22, color=ManimColor(ORANGE_3B1B), weight=BOLD)
        sd_label.next_to(mean_interp, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        sd_calc = MathTex(r"\sigma = \sqrt{200(0.40)(0.60)} \approx 6.93", font_size=26)
        sd_calc.next_to(sd_label, RIGHT, buff=0.3)
        sd_interp = Text(
            "\"The number who answer typically varies by about 6.93 from 80.\"",
            font_size=17, color=ManimColor(ORANGE_3B1B),
        )
        sd_interp.next_to(sd_label, DOWN, buff=0.12, aligned_edge=LEFT)
        self.play(Write(sd_label), Write(sd_calc), run_time=0.4)
        self.play(Write(sd_interp), run_time=0.3)
        self.wait(0.5)

        # ========== TEMPLATE ==========
        template_title = Text("Interpretation Template:", font_size=20, color=ManimColor(TEAL_3B1B), weight=BOLD)
        template_title.next_to(sd_interp, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        template = VGroup(
            Text("Mean: \"On average, [mu] [context units] out of [n].\"", font_size=16, color=GREY_B),
            Text("SD: \"The count typically varies by about [sigma] from [mu].\"", font_size=16, color=GREY_B),
        ).arrange(DOWN, buff=0.08, aligned_edge=LEFT).next_to(template_title, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(template_title), run_time=0.3)
        for line in template:
            self.play(Write(line), run_time=0.25)
        self.wait(0.5)

        closing = Text(
            "Always interpret in context — use the units of the problem.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
