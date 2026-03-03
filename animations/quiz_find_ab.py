from manim import *

class QuizFindAB(Scene):
    def construct(self):
        # Title
        title = Text("Finding a and b", font_size=48, color=YELLOW)
        self.play(Write(title))
        self.wait()
        self.play(title.animate.scale(0.6).to_edge(UP))

        # Show identity templates
        identity1 = MathTex(r"a^3 + b^3 = (a + b)(a^2 - ab + b^2)", font_size=36)
        identity2 = MathTex(r"a^3 - b^3 = (a - b)(a^2 + ab + b^2)", font_size=36)
        identities = VGroup(identity1, identity2).arrange(DOWN, buff=0.4).next_to(title, DOWN, buff=0.5)
        self.play(Write(identity1))
        self.play(Write(identity2))
        self.wait(2)
        self.play(identities.animate.scale(0.7).to_edge(LEFT).shift(UP))

        # Example 1: 8 + 125x³
        ex1_title = Text("Example 1:", font_size=32, color=BLUE).to_edge(RIGHT).shift(UP * 2)
        ex1_expr = MathTex(r"8 + 125x^3", font_size=40, color=BLUE).next_to(ex1_title, DOWN, buff=0.3)
        self.play(Write(ex1_title), Write(ex1_expr))
        self.wait()

        # First term: 8
        term1 = MathTex(r"8", font_size=36, color=WHITE).next_to(ex1_expr, DOWN, buff=0.8).shift(LEFT * 2)
        question1 = Text("What cubes to 8?", font_size=24).next_to(term1, DOWN, buff=0.3)
        self.play(Write(term1), Write(question1))
        self.wait()

        cube1 = MathTex(r"2^3 = 8", font_size=32).next_to(question1, DOWN, buff=0.3)
        self.play(Write(cube1))
        self.wait()

        a_value1 = MathTex(r"a = 2", font_size=36, color=GREEN).next_to(cube1, DOWN, buff=0.3)
        self.play(Write(a_value1))
        self.wait()

        # Second term: 125x³
        term2 = MathTex(r"125x^3", font_size=36, color=WHITE).next_to(ex1_expr, DOWN, buff=0.8).shift(RIGHT * 2)
        question2 = Text("What cubes to 125x³?", font_size=24).next_to(term2, DOWN, buff=0.3)
        self.play(Write(term2), Write(question2))
        self.wait()

        cube2 = MathTex(r"(5x)^3 = 125x^3", font_size=32).next_to(question2, DOWN, buff=0.3)
        self.play(Write(cube2))
        self.wait()

        b_value1 = MathTex(r"b = 5x", font_size=36, color=GREEN).next_to(cube2, DOWN, buff=0.3)
        self.play(Write(b_value1))
        self.wait()

        # Verification
        verify1 = MathTex(r"2^3 = 8 \,\checkmark", font_size=28, color=GREEN).to_corner(DR).shift(UP * 1.5)
        verify2 = MathTex(r"(5x)^3 = 125x^3 \,\checkmark", font_size=28, color=GREEN).next_to(verify1, DOWN, buff=0.2)
        self.play(Write(verify1), Write(verify2))
        self.wait(2)

        # Clear for Example 2
        self.play(
            FadeOut(ex1_title), FadeOut(ex1_expr), FadeOut(term1), FadeOut(question1),
            FadeOut(cube1), FadeOut(a_value1), FadeOut(term2), FadeOut(question2),
            FadeOut(cube2), FadeOut(b_value1), FadeOut(verify1), FadeOut(verify2)
        )

        # Example 2: 64 + 27a³
        ex2_title = Text("Example 2:", font_size=32, color=BLUE).to_edge(RIGHT).shift(UP * 2)
        ex2_expr = MathTex(r"64 + 27a^3", font_size=40, color=BLUE).next_to(ex2_title, DOWN, buff=0.3)
        self.play(Write(ex2_title), Write(ex2_expr))
        self.wait()

        # 64 → 4³
        step1 = MathTex(r"64 \rightarrow 4^3 = 64", font_size=32).next_to(ex2_expr, DOWN, buff=0.8)
        a_value2 = MathTex(r"a = 4", font_size=36, color=GREEN).next_to(step1, DOWN, buff=0.3)
        self.play(Write(step1))
        self.play(Write(a_value2))
        self.wait()

        # 27a³ → (3a)³
        step2 = MathTex(r"27a^3 \rightarrow (3a)^3 = 27a^3", font_size=32).next_to(a_value2, DOWN, buff=0.8)
        b_value2 = MathTex(r"b = 3a", font_size=36, color=GREEN).next_to(step2, DOWN, buff=0.3)
        self.play(Write(step2))
        self.play(Write(b_value2))
        self.wait(2)

        # Clear for Example 3
        self.play(
            FadeOut(ex2_title), FadeOut(ex2_expr), FadeOut(step1),
            FadeOut(a_value2), FadeOut(step2), FadeOut(b_value2)
        )

        # Example 3: 729 − 8k³
        ex3_title = Text("Example 3 (difference):", font_size=32, color=BLUE).to_edge(RIGHT).shift(UP * 2)
        ex3_expr = MathTex(r"729 - 8k^3", font_size=40, color=BLUE).next_to(ex3_title, DOWN, buff=0.3)
        self.play(Write(ex3_title), Write(ex3_expr))
        self.wait()

        # 729 → 9³
        step3 = MathTex(r"729 \rightarrow 9^3", font_size=32).next_to(ex3_expr, DOWN, buff=0.8)
        a_value3 = MathTex(r"a = 9", font_size=36, color=GREEN).next_to(step3, RIGHT, buff=0.5)
        self.play(Write(step3), Write(a_value3))
        self.wait()

        # 8k³ → (2k)³
        step4 = MathTex(r"8k^3 \rightarrow (2k)^3", font_size=32).next_to(step3, DOWN, buff=0.5)
        b_value3 = MathTex(r"b = 2k", font_size=36, color=GREEN).next_to(step4, RIGHT, buff=0.5)
        self.play(Write(step4), Write(b_value3))
        self.wait(2)

        # Clear examples
        self.play(
            FadeOut(ex3_title), FadeOut(ex3_expr), FadeOut(step3),
            FadeOut(a_value3), FadeOut(step4), FadeOut(b_value3)
        )

        # Key insight
        insight = Text("Take the cube root of each term.", font_size=32, color=YELLOW)
        insight2 = Text("That's your a and b!", font_size=32, color=YELLOW).next_to(insight, DOWN, buff=0.2)
        insight_group = VGroup(insight, insight2).move_to(ORIGIN)
        box = SurroundingRectangle(insight_group, color=YELLOW, buff=0.3)

        self.play(Write(insight))
        self.play(Write(insight2))
        self.play(Create(box))
        self.wait(3)

        self.play(FadeOut(insight_group), FadeOut(box), FadeOut(identities), FadeOut(title))
        self.wait()
