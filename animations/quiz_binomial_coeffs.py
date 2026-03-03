from manim import *

class QuizBinomialCoeffs(Scene):
    def construct(self):
        # Title
        title = Text("Finding a Binomial Term Coefficient", font_size=48, color=YELLOW)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait()

        # Formula
        formula = MathTex(
            r"\text{The } k\text{-th term of } (x + c)^n",
            r"\text{ has coefficient }",
            r"C(n,k) \cdot c^k",
            font_size=36
        )
        formula[2].set_color(BLUE)
        formula.next_to(title, DOWN, buff=0.5)
        self.play(Write(formula))
        self.wait(2)

        # Pascal's Triangle
        self.play(FadeOut(formula))
        pascal_title = Text("Pascal's Triangle (n = 5)", font_size=32, color=YELLOW)
        pascal_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(pascal_title))

        rows = [
            ["1"],
            ["1", "1"],
            ["1", "2", "1"],
            ["1", "3", "3", "1"],
            ["1", "4", "6", "4", "1"],
            ["1", "5", "10", "10", "5", "1"]
        ]

        pascal_objs = VGroup()
        for i, row in enumerate(rows):
            row_obj = VGroup()
            for j, num in enumerate(row):
                text = Text(num, font_size=28)
                text.move_to([j * 0.6 - (len(row) - 1) * 0.3, 1.5 - i * 0.5, 0])
                row_obj.add(text)
            pascal_objs.add(row_obj)

        pascal_objs.next_to(pascal_title, DOWN, buff=0.4)
        self.play(Write(pascal_objs))
        self.wait()

        # Highlight Row 5
        row5_rect = SurroundingRectangle(pascal_objs[5], color=BLUE, buff=0.1)
        self.play(Create(row5_rect))
        self.wait()

        # Worked example
        self.play(FadeOut(pascal_title), FadeOut(row5_rect))
        example = Text("Coefficient of x³ in (x − 3)⁵", font_size=36, color=YELLOW)
        example.next_to(title, DOWN, buff=0.5)
        self.play(Write(example))
        self.wait()

        # Step 1: Find k
        step1_text = Text("x³ means k = 2", font_size=28)
        step1_detail = Text("(since power = n − k = 5 − 2 = 3)", font_size=24, color=GRAY)
        step1 = VGroup(step1_text, step1_detail).arrange(DOWN, buff=0.2)
        step1.move_to([3.5, 1, 0])
        self.play(Write(step1))
        self.wait()

        # Step 2: C(5,2) = 10
        pascal_objs[5][2].set_color(GREEN)
        self.play(pascal_objs[5][2].animate.scale(1.3))
        step2 = MathTex(r"C(5,2) = 10", font_size=32, color=GREEN)
        step2.move_to([3.5, 0.2, 0])
        self.play(Write(step2))
        self.wait()

        # Step 3: (-3)^2 = 9
        step3_calc = MathTex(r"(-3)^2 = 9", font_size=32)
        step3_note = Text("even power → POSITIVE", font_size=20, color=GREEN)
        step3 = VGroup(step3_calc, step3_note).arrange(DOWN, buff=0.1)
        step3.move_to([3.5, -0.6, 0])
        self.play(Write(step3))
        self.wait()

        # Step 4: Final answer
        step4 = MathTex(r"10 \times 9 = 90", font_size=36, color=GREEN)
        step4.move_to([3.5, -1.5, 0])
        answer_box = SurroundingRectangle(step4, color=GREEN, buff=0.15)
        self.play(Write(step4))
        self.play(Create(answer_box))
        self.wait(2)

        # Clear for second example
        self.play(
            FadeOut(step1), FadeOut(step2), FadeOut(step3), FadeOut(step4),
            FadeOut(answer_box), FadeOut(example),
            pascal_objs[5][2].animate.scale(1/1.3).set_color(WHITE)
        )

        # Second example
        example2 = Text("Coefficient of x⁴ in (x − 3)⁵", font_size=36, color=YELLOW)
        example2.next_to(title, DOWN, buff=0.5)
        self.play(Write(example2))
        self.wait()

        # Quick solution
        soln2_line1 = MathTex(r"k = 1,\quad C(5,1) = 5", font_size=28)
        pascal_objs[5][1].set_color(BLUE)
        self.play(pascal_objs[5][1].animate.scale(1.2))
        soln2_line1.move_to([3.5, 0.8, 0])
        self.play(Write(soln2_line1))
        self.wait()

        soln2_line2 = MathTex(r"(-3)^1 = -3", font_size=28, color=RED)
        soln2_note = Text("ODD power → NEGATIVE", font_size=20, color=RED)
        soln2_group = VGroup(soln2_line2, soln2_note).arrange(DOWN, buff=0.1)
        soln2_group.move_to([3.5, 0.1, 0])
        self.play(Write(soln2_group))
        self.wait()

        soln2_answer = MathTex(r"5 \times (-3) = -15", font_size=32, color=RED)
        soln2_answer.move_to([3.5, -0.8, 0])
        answer2_box = SurroundingRectangle(soln2_answer, color=RED, buff=0.15)
        self.play(Write(soln2_answer))
        self.play(Create(answer2_box))
        self.wait(2)

        # Clear everything except title and Pascal's triangle
        self.play(
            FadeOut(example2), FadeOut(soln2_line1), FadeOut(soln2_group),
            FadeOut(soln2_answer), FadeOut(answer2_box),
            pascal_objs[5][1].animate.scale(1/1.2).set_color(WHITE)
        )

        # Key insight
        insight_text1 = Text("3 steps:", font_size=28, weight=BOLD)
        insight_text2 = Text("(1) Find k from the power of x", font_size=24)
        insight_text3 = Text("(2) Get C(n,k) from Pascal's row", font_size=24)
        insight_text4 = Text("(3) Multiply by c^k", font_size=24)
        insight_text5 = Text("WATCH THE SIGN!", font_size=28, color=RED, weight=BOLD)

        insight = VGroup(insight_text1, insight_text2, insight_text3, insight_text4, insight_text5)
        insight.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        insight.move_to([3, -0.5, 0])

        insight_box = SurroundingRectangle(insight, color=YELLOW, buff=0.2)
        self.play(Create(insight_box))
        self.play(Write(insight))
        self.wait(3)

        self.play(FadeOut(insight_box), FadeOut(insight), FadeOut(pascal_objs))
        self.wait()
