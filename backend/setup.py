from setuptools import setup, find_packages

with open('requirements.txt') as f:
    requirements = f.read().splitlines()

setup(
    name="glancer-backend",
    version="0.0.1",
    author="kination",
    author_email="kination27@example.com",
    description="Backend for Glancer Electron app.",
    long_description=open('README.md').read() if open('README.md', 'r', encoding='utf-8') else '',
    long_description_content_type="text/markdown",
    url="https://github.com/kination/glancer", # 프로젝트 URL
    packages=find_packages(),
    install_requires=requirements,
    entry_points={
        'console_scripts': [
            'glancer-backend=app:main',
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.12',
)