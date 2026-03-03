from manim import *

class QuizExplainChoice(Scene):
    def construct(self):
        # Title
        title = Text("Writing a Strong Explanation", color=YELLOW, font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait()

        # Show the quiz question
        question = Text("Explain how you knew which identity to use.", font_size=32, color=WHITE)
        question.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(question))
        self.wait(2)

        # Rubric criteria
        self.play(FadeOut(question))
        rubric_title = Text("Grading Rubric", font_size=36, color=YELLOW)
        rubric_title.next_to(title, DOWN, buff=0.5)

        e_criteria = Text("E: Mentions SIGN (+/−) AND both terms are perfect cubes",
                         font_size=28, color=GREEN)
        p_criteria = Text("P: Mentions only ONE of the two elements",
                         font_size=28, color=YELLOW)
        i_criteria = Text("I: No relevant reasoning",
                         font_size=28, color=RED)

        criteria = VGroup(e_criteria, p_criteria, i_criteria)
        criteria.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        criteria.next_to(rubric_title, DOWN, buff=0.5)

        self.play(Write(rubric_title))
        self.play(FadeIn(e_criteria))
        self.wait(0.5)
        self.play(FadeIn(p_criteria))
        self.wait(0.5)
        self.play(FadeIn(i_criteria))
        self.wait(2)

        # Clear for model response
        self.play(FadeOut(rubric_title), FadeOut(criteria))

        # Model E-level response (sum of cubes)
        model_title = Text("Model E-Level Response (Sum)", font_size=32, color=GREEN)
        model_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(model_title))

        response1_part1 = Text("I used the sum of cubes identity because the expression uses",
                              font_size=24)
        response1_part2 = Text("addition (+), and both terms are perfect cubes:",
                              font_size=24)
        response1_part3 = MathTex("2^3 = 8", font_size=32)
        response1_part4 = Text(" and ", font_size=24)
        response1_part5 = MathTex("(5x)^3 = 125x^3", font_size=32)

        response1_line1 = VGroup(response1_part1)
        response1_line2 = VGroup(response1_part2)
        response1_line3 = VGroup(response1_part3, response1_part4, response1_part5)
        response1_line3.arrange(RIGHT, buff=0.15)

        response1 = VGroup(response1_line1, response1_line2, response1_line3)
        response1.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        response1.next_to(model_title, DOWN, buff=0.4)

        self.play(Write(response1))
        self.wait(2)

        # Highlight key parts
        sign_highlight = SurroundingRectangle(response1_part2[16:20], color=BLUE, buff=0.05)
        cubes_text = response1_part2[30:44]
        cubes_highlight = SurroundingRectangle(cubes_text, color=GREEN, buff=0.05)
        cube1_highlight = SurroundingRectangle(response1_part3, color=GREEN, buff=0.1)
        cube2_highlight = SurroundingRectangle(response1_part5, color=GREEN, buff=0.1)

        self.play(Create(sign_highlight))
        self.wait(0.5)
        self.play(Create(cubes_highlight))
        self.wait(0.5)
        self.play(Create(cube1_highlight), Create(cube2_highlight))
        self.wait(2)

        # Clear for second model
        self.play(FadeOut(response1), FadeOut(sign_highlight), FadeOut(cubes_highlight),
                 FadeOut(cube1_highlight), FadeOut(cube2_highlight), FadeOut(model_title))

        # Model E-level response (difference of cubes)
        model_title2 = Text("Model E-Level Response (Difference)", font_size=32, color=GREEN)
        model_title2.next_to(title, DOWN, buff=0.5)
        self.play(Write(model_title2))

        response2_part1 = Text("I used the difference of cubes because the expression uses",
                              font_size=24)
        response2_part2 = Text("subtraction (−), and both 27 and ", font_size=24)
        response2_part3 = MathTex("8y^3", font_size=28)
        response2_part4 = Text(" are perfect cubes:", font_size=24)
        response2_part5 = MathTex("3^3 = 27", font_size=32)
        response2_part6 = Text(" and ", font_size=24)
        response2_part7 = MathTex("(2y)^3 = 8y^3", font_size=32)

        response2_line1 = VGroup(response2_part1)
        response2_line2 = VGroup(response2_part2, response2_part3, response2_part4)
        response2_line2.arrange(RIGHT, buff=0.1)
        response2_line3 = VGroup(response2_part5, response2_part6, response2_part7)
        response2_line3.arrange(RIGHT, buff=0.15)

        response2 = VGroup(response2_line1, response2_line2, response2_line3)
        response2.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        response2.next_to(model_title2, DOWN, buff=0.4)

        self.play(Write(response2))
        self.wait(2)

        # Clear for checklist
        self.play(FadeOut(response2), FadeOut(model_title2))

        # Two-part checklist
        checklist_title = Text("Your Checklist", font_size=36, color=YELLOW)
        checklist_title.next_to(title, DOWN, buff=0.8)

        check1 = Text("✓ Step 1: Name the sign (+ or −)", font_size=32, color=BLUE)
        check2 = Text("✓ Step 2: Show both terms are cubes (give cube roots)",
                     font_size=32, color=GREEN)

        checklist = VGroup(check1, check2)
        checklist.arrange(DOWN, aligned_edge=LEFT, buff=0.4)
        checklist.next_to(checklist_title, DOWN, buff=0.5)

        checklist_box = SurroundingRectangle(VGroup(checklist_title, checklist),
                                            color=YELLOW, buff=0.3)

        self.play(Write(checklist_title))
        self.play(Write(check1))
        self.wait(1)
        self.play(Write(check2))
        self.wait(1)
        self.play(Create(checklist_box))
        self.wait(3)
