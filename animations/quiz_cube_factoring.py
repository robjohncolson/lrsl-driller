from manim import *

class QuizCubeFactoring(Scene):
    def construct(self):
        # Title
        title = Text("SOAP: Factoring Cubes Step by Step", color=YELLOW, font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)

        # SOAP Mnemonic
        soap_title = Text("SOAP Mnemonic", color=YELLOW, font_size=36)
        soap_title.next_to(title, DOWN, buff=0.5)

        soap_lines = VGroup(
            Text("S = Same sign", color=WHITE, font_size=32),
            Text("O = Opposite sign", color=WHITE, font_size=32),
            Text("A = Always", color=WHITE, font_size=32),
            Text("P = Positive", color=WHITE, font_size=32)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        soap_lines.next_to(soap_title, DOWN, buff=0.4)

        self.play(Write(soap_title))
        self.play(Write(soap_lines), run_time=2)
        self.wait(1)

        # Template with colored boxes
        template = MathTex(r"(a", r"\square", r"b)(a^2", r"\square", r"ab", r"\square", r"b^2)")
        template.scale(1.2)
        template.next_to(soap_lines, DOWN, buff=0.5)

        # Color the boxes to match SOAP
        template[1].set_color(GREEN)  # S - Same
        template[3].set_color(RED)    # O - Opposite
        template[5].set_color(BLUE)   # AP - Always Positive

        self.play(Write(template))
        self.wait(2)

        # Clear for example
        self.play(FadeOut(soap_lines, soap_title, template))

        # Example 1: 8 + 125x³
        example1_title = Text("Example 1: Factor 8 + 125x³", color=YELLOW, font_size=36)
        example1_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(example1_title))
        self.wait(1)

        # Step 1: Identify a and b
        step1 = Text("Step 1: Identify cube roots", color=WHITE, font_size=28)
        step1.next_to(example1_title, DOWN, buff=0.4)
        identify = MathTex(r"a = 2", r"\quad", r"b = 5x", font_size=36)
        identify.next_to(step1, DOWN, buff=0.3)

        self.play(Write(step1))
        self.play(Write(identify))
        self.wait(1.5)

        # Step 2: Determine first sign
        step2 = Text("Step 2: It's a SUM (+), so first sign is +", color=WHITE, font_size=28)
        step2.next_to(identify, DOWN, buff=0.4)
        self.play(Write(step2))
        self.wait(1.5)

        # Step 3: Apply SOAP
        step3 = Text("Step 3: Apply SOAP", color=WHITE, font_size=28)
        step3.next_to(step2, DOWN, buff=0.4)
        self.play(Write(step3))
        self.wait(0.5)

        # SOAP template with labels
        soap_template = MathTex(r"(a", r"+", r"b)(a^2", r"-", r"ab", r"+", r"b^2)")
        soap_template.scale(1.1)
        soap_template.next_to(step3, DOWN, buff=0.3)

        # Color SOAP positions
        soap_template[1].set_color(GREEN)  # S - Same (+)
        soap_template[3].set_color(RED)    # O - Opposite (-)
        soap_template[5].set_color(BLUE)   # AP - Always Positive (+)

        # SOAP labels
        s_label = Text("S", color=GREEN, font_size=24).next_to(soap_template[1], UP, buff=0.1)
        o_label = Text("O", color=RED, font_size=24).next_to(soap_template[3], UP, buff=0.1)
        ap_label = Text("AP", color=BLUE, font_size=24).next_to(soap_template[5], UP, buff=0.1)

        self.play(Write(soap_template))
        self.play(Write(VGroup(s_label, o_label, ap_label)))
        self.wait(2)

        # Clear labels
        self.play(FadeOut(s_label, o_label, ap_label))

        # Step 4: Substitute
        step4 = Text("Step 4: Substitute a = 2, b = 5x", color=WHITE, font_size=28)
        step4.next_to(soap_template, DOWN, buff=0.4)
        self.play(Write(step4))
        self.wait(0.5)

        # Final answer
        answer1 = MathTex(r"(2 + 5x)(4 - 10x + 25x^2)", font_size=40)
        answer1.next_to(step4, DOWN, buff=0.3)
        answer_box = SurroundingRectangle(answer1, color=GREEN, buff=0.2)

        self.play(Write(answer1))
        self.play(Create(answer_box))
        self.wait(2)

        # Clear for example 2
        self.play(FadeOut(example1_title, step1, identify, step2, step3, soap_template, step4, answer1, answer_box))

        # Example 2: 27 - 8y³
        example2_title = Text("Example 2: Factor 27 − 8y³", color=YELLOW, font_size=36)
        example2_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(example2_title))
        self.wait(1)

        # Quick solution
        ex2_identify = MathTex(r"a = 3, \quad b = 2y", font_size=32)
        ex2_identify.next_to(example2_title, DOWN, buff=0.4)

        ex2_note = Text("DIFFERENCE (−), so first sign is −", color=WHITE, font_size=28)
        ex2_note.next_to(ex2_identify, DOWN, buff=0.3)

        ex2_soap = MathTex(r"(a", r"-", r"b)(a^2", r"+", r"ab", r"+", r"b^2)")
        ex2_soap.scale(1.1)
        ex2_soap.next_to(ex2_note, DOWN, buff=0.3)
        ex2_soap[1].set_color(GREEN)  # S - Same (-)
        ex2_soap[3].set_color(RED)    # O - Opposite (+)
        ex2_soap[5].set_color(BLUE)   # AP - Always Positive (+)

        answer2 = MathTex(r"(3 - 2y)(9 + 6y + 4y^2)", font_size=38)
        answer2.next_to(ex2_soap, DOWN, buff=0.4)
        answer2_box = SurroundingRectangle(answer2, color=GREEN, buff=0.2)

        self.play(Write(ex2_identify))
        self.play(Write(ex2_note))
        self.wait(1)
        self.play(Write(ex2_soap))
        self.wait(1)
        self.play(Write(answer2))
        self.play(Create(answer2_box))
        self.wait(2)

        # Warning box
        self.play(FadeOut(example2_title, ex2_identify, ex2_note, ex2_soap, answer2, answer2_box))

        warning = Text("Common mistake: getting the middle sign wrong!", color=RED, font_size=32)
        warning.move_to(ORIGIN)
        warning_tip = Text("Use SOAP!", color=YELLOW, font_size=32)
        warning_tip.next_to(warning, DOWN, buff=0.3)
        warning_box = SurroundingRectangle(VGroup(warning, warning_tip), color=RED, buff=0.3)

        self.play(Write(warning))
        self.play(Write(warning_tip))
        self.play(Create(warning_box))
        self.wait(2)

        self.play(FadeOut(warning, warning_tip, warning_box))

        # Final insight
        insight = Text("The last term (b²) is ALWAYS positive.", color=WHITE, font_size=30)
        insight2 = Text("The middle sign is OPPOSITE the first.", color=WHITE, font_size=30)
        insight_group = VGroup(insight, insight2).arrange(DOWN, buff=0.3)
        insight_group.move_to(ORIGIN)
        insight_box = SurroundingRectangle(insight_group, color=BLUE, buff=0.3)

        self.play(Write(insight_group))
        self.play(Create(insight_box))
        self.wait(3)

        self.play(FadeOut(insight_group, insight_box, title))
        self.wait(0.5)
