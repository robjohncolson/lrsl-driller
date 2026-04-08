"""
L01 — Zeros & Multiplicity Vocabulary
Covers the key vocab terms tested in this level and adds a tiny visual to
every card so students can connect the vocabulary to a graph or equation.

Run with:
manim -qm --format=mp4 a01_zero_mult_vocab.py ZeroMultVocab
"""
from manim import *
from common import ACCENT, BG, INK, MUTED, NEG, POS, SOFT, footer_note, setup_scene, simple_axes


class ZeroMultVocab(Scene):
    def construct(self):
        setup_scene(self, "Key Vocabulary")

        def tiny_axes():
            return Axes(
                x_range=[-2, 2, 1],
                y_range=[-2, 2, 1],
                x_length=2.1,
                y_length=1.5,
                axis_config={"color": INK, "stroke_width": 2},
                tips=False
            )

        def build_visual(kind, color):
            if kind == "zero":
                axes = tiny_axes().scale(0.42)
                graph = axes.plot(lambda x: x - 0.4, color=color, x_range=[-1.6, 1.6])
                dot = Dot(axes.c2p(0.4, 0), color=ACCENT, radius=0.05)
                return VGroup(axes, graph, dot)

            if kind == "multiplicity":
                return VGroup(
                    MathTex(r"(x-1)^3", font_size=26, color=INK),
                    Text("repeat 3 times", font_size=15, color=color)
                ).arrange(DOWN, buff=0.08)

            if kind == "end":
                axes = tiny_axes().scale(0.42)
                graph = axes.plot(lambda x: 0.35 * x ** 2 - 1, color=color, x_range=[-1.5, 1.5])
                arrows = VGroup(
                    Arrow(axes.c2p(-1.4, -0.3), axes.c2p(-1.4, 0.6), buff=0, color=color, stroke_width=4),
                    Arrow(axes.c2p(1.4, -0.3), axes.c2p(1.4, 0.6), buff=0, color=color, stroke_width=4)
                )
                return VGroup(axes, graph, arrows)

            if kind == "product":
                return MathTex(r"ab=0\Rightarrow a=0\ \text{or}\ b=0", font_size=24, color=INK)

            if kind == "interval":
                line = NumberLine(x_range=[-2, 2, 1], length=2.4, color=INK, include_numbers=False)
                segment = Line(line.n2p(-1.1), line.n2p(1.2), color=color, stroke_width=5)
                left = Circle(radius=0.09, color=color).move_to(line.n2p(-1.1))
                right = Dot(line.n2p(1.2), color=color, radius=0.07)
                return VGroup(line, segment, left, right)

            if kind == "cross-touch":
                left_axes = tiny_axes().scale(0.24)
                right_axes = tiny_axes().scale(0.24)
                left_graph = left_axes.plot(lambda x: (x - 0.4) ** 3, color=POS, x_range=[-1.3, 1.2])
                right_graph = right_axes.plot(lambda x: 0.9 * (x - 0.4) ** 2 - 0.1, color=NEG, x_range=[-1.3, 1.2])
                pair = VGroup(
                    VGroup(left_axes, left_graph),
                    VGroup(right_axes, right_graph)
                ).arrange(RIGHT, buff=0.25)
                return pair

            degree = VGroup(
                Text("degree 3", font_size=18, color=color, weight=BOLD),
                MathTex(r"x(x-2)(x+1)", font_size=24, color=INK),
                Text("3 zeros total", font_size=15, color=INK)
            ).arrange(DOWN, buff=0.08)
            return degree

        def build_card(title, body, color, kind):
            frame = RoundedRectangle(width=5.8, height=1.65, corner_radius=0.16, color=color)
            frame.set_fill(BG, opacity=1)
            label = Text(title, font_size=24, weight=BOLD, color=color)
            body_text = Text(body, font_size=16, color=INK, line_spacing=0.88)
            body_text.scale_to_fit_width(3.35)
            text_block = VGroup(label, body_text).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
            visual = build_visual(kind, color)
            visual.scale_to_fit_width(1.55)
            content = VGroup(text_block, visual).arrange(RIGHT, buff=0.28, aligned_edge=UP)
            content.move_to(frame)
            return VGroup(frame, content)

        cards = [
            build_card("Zero (root)", "x-value where the graph hits\nthe x-axis", ACCENT, "zero"),
            build_card("Multiplicity", "Exponent on a repeated\nfactor", SOFT, "multiplicity"),
            build_card("End Behavior", "What the graph does far\nleft and far right", POS, "end"),
            build_card("Zero-Product", "If a product is 0, at least\none factor is 0", NEG, "product"),
            build_card("Interval Notation", "Parentheses exclude.\nBrackets include.", MUTED, "interval"),
            build_card("Cross vs Touch", "Odd crosses.\nEven touches.", ACCENT, "cross-touch"),
            build_card("Degree Rule", "Degree n means n zeros,\ncounting multiplicity.", POS, "degree"),
        ]

        left_col = VGroup(cards[0], cards[2], cards[4], cards[6]).arrange(DOWN, buff=0.22)
        right_col = VGroup(cards[1], cards[3], cards[5]).arrange(DOWN, buff=0.22)
        board = VGroup(left_col, right_col).arrange(RIGHT, buff=0.28, aligned_edge=UP)
        board.scale(0.96).shift(DOWN * 0.18)

        for card in cards:
            self.play(FadeIn(card, shift=RIGHT * 0.2), run_time=0.35)

        self.play(
            Indicate(cards[5][0], color=ACCENT),
            Indicate(cards[6][0], color=POS),
            run_time=0.8
        )

        self.add(footer_note("Every card pairs the word with a tiny graph or algebra visual."))
        self.wait(2)
