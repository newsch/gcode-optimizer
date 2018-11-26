import argparse

parser = argparse.ArgumentParser(description='add g0s when pen should be rapid traveling')
parser.add_argument('filename')

args = parser.parse_args()

UP = "M03 S525"
DOWN = "M03 S975"
is_up = False


with open(args.filename) as file:
    for line in file:
        if line.split(" ")[0].lower() == "g1":
            # Figure out if it should be a g1 or a g0
            if is_up:
                # print out original line substituted with g0
                print(line.replace("1", "0", 1), end='')
            else:
                pass
                # print out original line
                print(line, end='')
        else:
            print(line.upper().strip() == UP)
            if line.upper().strip() == UP:
                is_up = True
            if line.upper().strip() == DOWN:
                is_up = False
            print(line, end='')
