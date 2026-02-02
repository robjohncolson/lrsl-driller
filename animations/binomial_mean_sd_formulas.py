"""
Binomial Mean and Standard Deviation Formulas Animation

Render command:
    manim -qm --format=mp4 binomial_mean_sd_formulas.py BinomialMeanSDFormulas

Target: AP Statistics students learning binomial distribution parameters
Duration: ~60 seconds
"""

from manim import *


class BinomialMeanSDFormulas(Scene):
    def construct(self):
        # Color scheme
        MEAN_COLOR = BLUE
        SD_COLOR = YELLOW
        INTERPRET_COLOR = GREEN

        # ===== TITLE =====
        title = Text("Binomial Parameters: Mean and Standard Deviation", font_size=36)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)
        self.wait(0.5)

        # ===== FORMULAS =====
        # Mean formula
        mean_label = Text("Mean:", font_size=28, color=MEAN_COLOR)
        mean_formula = MathTex(r"\mu", r"=", r"n", r"p", font_size=44)
        mean_formula[0].set_color(MEAN_COLOR)
        mean_group = VGroup(mean_label, mean_formula).arrange(RIGHT, buff=0.5)

        # Standard deviation formula
        sd_label = Text("Standard Deviation:", font_size=28, color=SD_COLOR)
        sd_formula = MathTex(r"\sigma", r"=", r"\sqrt{np(1-p)}", font_size=44)
        sd_formula[0].set_color(SD_COLOR)
        sd_group = VGroup(sd_label, sd_formula).arrange(RIGHT, buff=0.5)

        formulas = VGroup(mean_group, sd_group).arrange(DOWN, buff=0.6, aligned_edge=LEFT)
        formulas.next_to(title, DOWN, buff=0.8)

        self.play(FadeIn(mean_label), Write(mean_formula), run_time=1.2)
        self.wait(0.3)
        self.play(FadeIn(sd_label), Write(sd_formula), run_time=1.2)
        self.wait(1)

        # ===== MOVE FORMULAS UP, MAKE ROOM FOR EXAMPLE =====
        self.play(
            title.animate.scale(0.8).to_edge(UP, buff=0.3),
            formulas.animate.scale(0.75).next_to(title, DOWN, buff=0.4).to_edge(LEFT, buff=0.8),
            run_time=0.8
        )

        # ===== CONCRETE EXAMPLE =====
        example_title = Text("Example: n = 100, p = 0.25", font_size=30, color=WHITE)
        example_title.next_to(formulas, DOWN, buff=0.5).to_edge(LEFT, buff=0.8)

        self.play(Write(example_title), run_time=0.8)
        self.wait(0.5)

        # Mean calculation
        mean_calc = MathTex(
            r"\mu", r"=", r"100", r"\times", r"0.25", r"=", r"25",
            font_size=36
        )
        mean_calc[0].set_color(MEAN_COLOR)
        mean_calc[6].set_color(MEAN_COLOR)
        mean_calc.next_to(example_title, DOWN, buff=0.4).to_edge(LEFT, buff=1.2)

        self.play(Write(mean_calc), run_time=1.2)
        self.wait(0.5)

        # SD calculation
        sd_calc_1 = MathTex(
            r"\sigma", r"=", r"\sqrt{100 \times 0.25 \times 0.75}",
            font_size=36
        )
        sd_calc_1[0].set_color(SD_COLOR)
        sd_calc_1.next_to(mean_calc, DOWN, buff=0.3).to_edge(LEFT, buff=1.2)

        self.play(Write(sd_calc_1), run_time=1)
        self.wait(0.3)

        sd_calc_2 = MathTex(
            r"=", r"\sqrt{18.75}", r"\approx", r"4.33",
            font_size=36
        )
        sd_calc_2[3].set_color(SD_COLOR)
        sd_calc_2.next_to(sd_calc_1, DOWN, buff=0.2).align_to(sd_calc_1[1], LEFT)

        self.play(Write(sd_calc_2), run_time=1)
        self.wait(1)

        # ===== INTERPRETATION =====
        interp_box = RoundedRectangle(
            width=10, height=1.2,
            corner_radius=0.15,
            color=INTERPRET_COLOR,
            fill_opacity=0.15
        )
        interp_text = Text(
            "On average, expect 25 successes,\ntypically varying by about 4.33",
            font_size=26,
            color=INTERPRET_COLOR
        )
        interp_group = VGroup(interp_box, interp_text)
        interp_text.move_to(interp_box.get_center())
        interp_group.to_edge(DOWN, buff=0.8)

        self.play(
            Create(interp_box),
            Write(interp_text),
            run_time=1.5
        )
        self.wait(1.5)

        # ===== VARIANCE CONNECTION =====
        self.play(
            FadeOut(interp_group),
            FadeOut(example_title),
            FadeOut(mean_calc),
            FadeOut(sd_calc_1),
            FadeOut(sd_calc_2),
            run_time=0.6
        )

        # Show variance relationship
        var_title = Text("Variance and Standard Deviation", font_size=30)
        var_title.next_to(formulas, DOWN, buff=0.6)

        variance_eq = MathTex(
            r"\text{Variance}", r"=", r"\sigma^2", r"=", r"np(1-p)",
            font_size=38
        )
        variance_eq[2].set_color(SD_COLOR)
        variance_eq.next_to(var_title, DOWN, buff=0.4)

        sd_from_var = MathTex(
            r"\sigma", r"=", r"\sqrt{\text{Variance}}", r"=", r"\sqrt{np(1-p)}",
            font_size=38
        )
        sd_from_var[0].set_color(SD_COLOR)
        sd_from_var.next_to(variance_eq, DOWN, buff=0.4)

        self.play(Write(var_title), run_time=0.6)
        self.play(Write(variance_eq), run_time=1)
        self.wait(0.5)
        self.play(Write(sd_from_var), run_time=1)
        self.wait(1)

        # ===== KEY INSIGHT =====
        self.play(
            FadeOut(var_title),
            FadeOut(variance_eq),
            FadeOut(sd_from_var),
            run_time=0.5
        )

        insight_box = RoundedRectangle(
            width=11, height=1.8,
            corner_radius=0.2,
            color=WHITE,
            fill_opacity=0.1,
            stroke_width=2
        )

        insight_title = Text("Key Insight", font_size=28, color=YELLOW)
        insight_line1 = Text("Mean scales with n × p", font_size=26, color=MEAN_COLOR)
        insight_line2 = Text(
            "SD depends on BOTH success AND failure probabilities",
            font_size=26,
            color=SD_COLOR
        )

        insight_content = VGroup(insight_title, insight_line1, insight_line2)
        insight_content.arrange(DOWN, buff=0.25)

        insight_group = VGroup(insight_box, insight_content)
        insight_content.move_to(insight_box.get_center())
        insight_group.next_to(formulas, DOWN, buff=0.6)

        self.play(Create(insight_box), run_time=0.5)
        self.play(Write(insight_title), run_time=0.5)
        self.play(Write(insight_line1), run_time=0.8)
        self.play(Write(insight_line2), run_time=1)
        self.wait(0.5)

        # Highlight (1-p) in the original formula
        highlight_rect = SurroundingRectangle(
            sd_formula[2][3:],  # The (1-p) part
            color=RED,
            buff=0.1
        )

        note = Text("p(1-p) is maximized when p = 0.5", font_size=22, color=RED)
        note.next_to(insight_group, DOWN, buff=0.4)

        self.play(Create(highlight_rect), run_time=0.6)
        self.play(Write(note), run_time=0.8)
        self.wait(2)

        # Final fade
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1)
