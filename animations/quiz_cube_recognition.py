from manim import *

class QuizCubeRecognition(Scene):
    def construct(self):
        # Title
        title = Text("Spotting Perfect Cubes", color=YELLOW, font_size=48)
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.scale(0.6).to_edge(UP))
        self.wait(0.5)

        # Table of common perfect cubes
        table_title = Text("Common Perfect Cubes:", font_size=32).next_to(title, DOWN, buff=0.5)
        self.play(Write(table_title))
        self.wait(0.5)

        # Create cube table in two rows
        row1 = VGroup(
            MathTex("1^3 = 1"),
            MathTex("2^3 = 8"),
            MathTex("3^3 = 27"),
            MathTex("4^3 = 64"),
            MathTex("5^3 = 125")
        ).arrange(RIGHT, buff=0.5).scale(0.8)

        row2 = VGroup(
            MathTex("6^3 = 216"),
            MathTex("7^3 = 343"),
            MathTex("8^3 = 512"),
            MathTex("9^3 = 729"),
            MathTex("10^3 = 1000")
        ).arrange(RIGHT, buff=0.4).scale(0.8)

        table = VGroup(row1, row2).arrange(DOWN, buff=0.3).next_to(table_title, DOWN, buff=0.3)
        self.play(FadeIn(table))
        self.wait(2)

        # Variable cubes
        var_title = Text("Variable Cubes:", font_size=32).next_to(table, DOWN, buff=0.5)
        var_cubes = VGroup(
            MathTex("x^3"),
            MathTex("(2x)^3 = 8x^3"),
            MathTex("(3a)^3 = 27a^3"),
            MathTex("(5x)^3 = 125x^3")
        ).arrange(RIGHT, buff=0.5).scale(0.8).next_to(var_title, DOWN, buff=0.3)

        self.play(Write(var_title))
        self.wait(0.3)
        self.play(FadeIn(var_cubes))
        self.wait(2)

        # Clear for decision rule
        self.play(
            FadeOut(table_title), FadeOut(table),
            FadeOut(var_title), FadeOut(var_cubes)
        )
        self.wait(0.5)

        # Decision rule
        rule_title = Text("Decision Rule:", color=YELLOW, font_size=36).next_to(title, DOWN, buff=0.5)
        self.play(Write(rule_title))
        self.wait(0.5)

        check1 = Text("Both terms are perfect cubes?", font_size=28).next_to(rule_title, DOWN, buff=0.4)
        arrow1 = Text("↓ YES", color=GREEN, font_size=24).next_to(check1, DOWN, buff=0.3)

        check2 = Text("Connected by +  ?", font_size=28).next_to(arrow1, DOWN, buff=0.3)
        sum_label = Text("SUM of Cubes", color=GREEN, font_size=28).next_to(check2, RIGHT, buff=0.5)
        sum_box = SurroundingRectangle(sum_label, color=GREEN, buff=0.1)

        check3 = Text("Connected by −  ?", font_size=28).next_to(check2, DOWN, buff=0.3)
        diff_label = Text("DIFFERENCE of Cubes", color=RED, font_size=28).next_to(check3, RIGHT, buff=0.5)
        diff_box = SurroundingRectangle(diff_label, color=RED, buff=0.1)

        self.play(Write(check1))
        self.wait(0.5)
        self.play(Write(arrow1))
        self.wait(0.5)
        self.play(Write(check2), Write(sum_label), Create(sum_box))
        self.wait(0.5)
        self.play(Write(check3), Write(diff_label), Create(diff_box))
        self.wait(2)

        # Clear for examples
        self.play(
            FadeOut(rule_title), FadeOut(check1), FadeOut(arrow1),
            FadeOut(check2), FadeOut(sum_label), FadeOut(sum_box),
            FadeOut(check3), FadeOut(diff_label), FadeOut(diff_box)
        )
        self.wait(0.5)

        # Quick examples
        ex_title = Text("Quick Examples:", color=YELLOW, font_size=36).next_to(title, DOWN, buff=0.5)
        self.play(Write(ex_title))
        self.wait(0.5)

        ex1 = MathTex("8 + 125x^3", color=WHITE, font_size=36).next_to(ex_title, DOWN, buff=0.5)
        ex1_label = Text("Sum of Cubes ✓", color=GREEN, font_size=28).next_to(ex1, RIGHT, buff=0.5)

        ex2 = MathTex("64 + 27a^3", color=WHITE, font_size=36).next_to(ex1, DOWN, buff=0.4)
        ex2_label = Text("Sum of Cubes ✓", color=GREEN, font_size=28).next_to(ex2, RIGHT, buff=0.5)

        ex3 = MathTex("27 - 8y^3", color=WHITE, font_size=36).next_to(ex2, DOWN, buff=0.4)
        ex3_label = Text("Difference of Cubes ✓", color=RED, font_size=28).next_to(ex3, RIGHT, buff=0.5)

        self.play(Write(ex1), Write(ex1_label))
        self.wait(1)
        self.play(Write(ex2), Write(ex2_label))
        self.wait(1)
        self.play(Write(ex3), Write(ex3_label))
        self.wait(2)

        # Clear examples
        self.play(
            FadeOut(ex_title), FadeOut(ex1), FadeOut(ex1_label),
            FadeOut(ex2), FadeOut(ex2_label), FadeOut(ex3), FadeOut(ex3_label)
        )
        self.wait(0.5)

        # Key insight
        insight = VGroup(
            Text("Step 1: Check if BOTH terms are cubes.", font_size=28),
            Text("Step 2: Check the SIGN.", font_size=28)
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT).move_to(ORIGIN)

        insight_box = SurroundingRectangle(insight, color=BLUE, buff=0.3)

        self.play(Write(insight))
        self.wait(0.5)
        self.play(Create(insight_box))
        self.wait(3)

        self.play(FadeOut(insight), FadeOut(insight_box), FadeOut(title))
        self.wait(0.5)
