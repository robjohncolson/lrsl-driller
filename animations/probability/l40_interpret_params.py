"""
Manim animation for interpreting distribution parameters in context.

Run with:
manim -qm --format=mp4 l40_interpret_params.py InterpretParameters
"""

from manim import *

class InterpretParameters(Scene):
    def construct(self):
        # Title
        title = Text("Interpreting μ and σ in Context", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Example setup
        example_text = Text("Example: X = number of customers per hour", font_size=32)
        example_text.next_to(title, DOWN, buff=0.8)
        self.play(FadeIn(example_text))
        self.wait(0.5)

        # Parameters
        params = VGroup(
            MathTex(r"\mu = 12 \text{ customers}", font_size=36),
            MathTex(r"\sigma = 3 \text{ customers}", font_size=36)
        ).arrange(RIGHT, buff=1.5)
        params.next_to(example_text, DOWN, buff=0.6)
        self.play(Write(params))
        self.wait(1)

        # Mean interpretation
        mean_label = Text("Mean interpretation:", font_size=28, color=BLUE)
        mean_label.next_to(params, DOWN, buff=0.8).to_edge(LEFT, buff=0.5)

        mean_interp = Text(
            '"On average, 12 customers arrive per hour\n(in the long run)"',
            font_size=26,
            color=BLUE,
            slant=ITALIC
        )
        mean_interp.next_to(mean_label, DOWN, buff=0.3).shift(RIGHT * 0.3)

        self.play(FadeIn(mean_label))
        self.wait(0.3)
        self.play(Write(mean_interp))
        self.wait(1.5)

        # Std dev interpretation
        sd_label = Text("Standard deviation interpretation:", font_size=28, color=GREEN)
        sd_label.next_to(mean_interp, DOWN, buff=0.6).to_edge(LEFT, buff=0.5)

        sd_interp = Text(
            '"The number of customers typically deviates\nfrom 12 by about 3"',
            font_size=26,
            color=GREEN,
            slant=ITALIC
        )
        sd_interp.next_to(sd_label, DOWN, buff=0.3).shift(RIGHT * 0.3)

        self.play(FadeIn(sd_label))
        self.wait(0.3)
        self.play(Write(sd_interp))
        self.wait(1.5)

        # Clear for templates
        self.play(
            FadeOut(mean_label),
            FadeOut(mean_interp),
            FadeOut(sd_label),
            FadeOut(sd_interp),
            FadeOut(params)
        )
        self.wait(0.3)

        # Templates
        template_title = Text("Interpretation Templates:", font_size=32, weight=BOLD, color=YELLOW)
        template_title.next_to(example_text, DOWN, buff=0.7)
        self.play(Write(template_title))
        self.wait(0.5)

        # Mean template
        mean_template = VGroup(
            Text("μ:", font_size=28, color=BLUE, weight=BOLD),
            Text('"On average, [context] is [μ] [units]"', font_size=24, color=BLUE, slant=ITALIC)
        ).arrange(RIGHT, buff=0.4, aligned_edge=UP)
        mean_template.next_to(template_title, DOWN, buff=0.5).to_edge(LEFT, buff=0.8)

        self.play(FadeIn(mean_template))
        self.wait(1)

        # SD template
        sd_template = VGroup(
            Text("σ:", font_size=28, color=GREEN, weight=BOLD),
            Text('"[Context] typically varies from [μ]\nby about [σ] [units]"', font_size=24, color=GREEN, slant=ITALIC)
        ).arrange(RIGHT, buff=0.4, aligned_edge=UP)
        sd_template.next_to(mean_template, DOWN, buff=0.5).to_edge(LEFT, buff=0.8)

        self.play(FadeIn(sd_template))
        self.wait(1.5)

        # Key insight box
        insight_box = Rectangle(
            width=11,
            height=1.2,
            fill_color=YELLOW,
            fill_opacity=0.2,
            stroke_color=YELLOW,
            stroke_width=3
        )
        insight_text = Text(
            "Context + Units = Complete interpretation!",
            font_size=32,
            weight=BOLD,
            color=YELLOW
        )
        insight_text.move_to(insight_box.get_center())

        insight_group = VGroup(insight_box, insight_text)
        insight_group.next_to(sd_template, DOWN, buff=0.7)

        self.play(
            Create(insight_box),
            Write(insight_text)
        )
        self.wait(2)

        # Fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)
