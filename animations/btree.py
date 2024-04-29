from manim import *
from fleek import *
from manim.camera.moving_camera import MovingCamera

c = 0.1

class OpeningManim(MovingCameraScene):
    def construct(self):
        title = Title("").to_corner(UL)

        all_rect = []
        data_rect = []
        stack = []
        for i in range(0, 8):
            b = bin(i + 1)
            n = len(b) - len(b.rstrip('0'))

            rect = Rectangle(width=0.8, height=0.4, color=YELLOW if n > 0 else GRAY);
            if i > 0:
                rect.next_to(data_rect[i - 1], 2 * RIGHT)
            else:
                rect.to_corner(DL)

            text = Text(bin(i + 1), font_size=8).move_to(rect.get_center())
            if n > 0:
                text = Group(text, Text(str(n), font_size=10).next_to(text, DOWN))
            group = Group(rect, text)
            data_rect.append(group)
            all_rect.append(group)
            stack.append(group)

            c = i + 1
            while (c & 1) == 0:
                right = stack.pop()
                left = stack.pop()
                g =  Group(left, right)
                rect = Rectangle(width=0.4, height=0.4, color=RED).next_to(
                    g,
                    g.height * UP + UP,
                )

                all_rect.append(rect)
                stack.append(Group(rect, right, left))
                c = c >> 1

        while len(stack) >= 2:
            right = stack.pop()
            left = stack.pop()
            g =  Group(left, right)
            rect = Rectangle(width=0.4, height=0.4, color=RED).next_to(
                g,
                g.height * UP + UP,
            )
            all_rect.append(rect)

        all_rect[2].set(color=BLUE)
        all_rect[5].set(color=GREEN)
        all_rect[6].set(color=GREEN)
        all_rect[9].set(color=WHITE)

        print(len(all_rect))
        group = Group(*all_rect).scale(1.4).move_to(ORIGIN)
        self.add(group)
